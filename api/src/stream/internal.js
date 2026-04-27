import { request, fetch } from "undici";
import { Readable } from "node:stream";
import { closeRequest, getHeaders, pipe } from "./shared.js";
import { handleHlsPlaylist, isHlsResponse, probeInternalHLSTunnel } from "./internal-hls.js";

const CHUNK_SIZE = BigInt(8e6); // 8 MB
const min = (a, b) => a < b ? a : b;

const serviceNeedsChunks = new Set(["youtube", "vk"]);

async function* readChunks(streamInfo, size) {
    let read = 0n, chunksSinceTransplant = 0;
    while (read < size) {
        if (streamInfo.controller.signal.aborted) {
            throw new Error("controller aborted");
        }

        const chunk = await request(streamInfo.url, {
            headers: {
                ...getHeaders(streamInfo.service),
                Range: `bytes=${read}-${read + CHUNK_SIZE}`
            },
            dispatcher: streamInfo.dispatcher,
            signal: streamInfo.controller.signal,
            maxRedirections: 4
        });

        if (chunk.statusCode === 403 && chunksSinceTransplant >= 3 && streamInfo.transplant) {
            chunksSinceTransplant = 0;
            try {
                await streamInfo.transplant(streamInfo.dispatcher);
                continue;
            } catch {}
        }

        chunksSinceTransplant++;

        const expected = min(CHUNK_SIZE, size - read);
        const received = BigInt(chunk.headers['content-length']);

        if (received < expected / 2n) {
            closeRequest(streamInfo.controller);
        }

        for await (const data of chunk.body) {
            yield data;
        }

        read += received;
    }
}

async function handleChunkedStream(streamInfo, res) {
    const { signal } = streamInfo.controller;
    const cleanup = () => (res.end(), closeRequest(streamInfo.controller));

    try {
        let probeResult, attempts = 3;

        const probeSize = async () => {
            let headResponse;

            try {
                headResponse = await fetch(streamInfo.url, {
                    headers: getHeaders(streamInfo.service),
                    method: 'HEAD',
                    dispatcher: streamInfo.dispatcher,
                    signal
                });

                streamInfo.url = headResponse.url;

                const contentLength = headResponse.headers.get('content-length');
                if (headResponse.status === 200 && contentLength) {
                    return {
                        status: headResponse.status,
                        size: BigInt(contentLength),
                        contentType: headResponse.headers.get('content-type') || undefined,
                    };
                }
            } catch {}

            const rangeResponse = await fetch(streamInfo.url, {
                headers: {
                    ...getHeaders(streamInfo.service),
                    Range: 'bytes=0-0'
                },
                method: 'GET',
                dispatcher: streamInfo.dispatcher,
                signal
            });

            streamInfo.url = rangeResponse.url;

            try {
                await rangeResponse.body?.cancel();
            } catch {}

            const contentRange = rangeResponse.headers.get('content-range');
            const totalSize = contentRange?.match(/\/(\d+)$/)?.[1]
                || rangeResponse.headers.get('content-length');

            if (
                [200, 206].includes(rangeResponse.status)
                && totalSize
            ) {
                return {
                    status: 200,
                    size: BigInt(totalSize),
                    contentType: rangeResponse.headers.get('content-type') || undefined,
                };
            }
        };

        while (attempts--) {
            const result = await probeSize().catch(() => {});

            if (result?.size) {
                probeResult = result;
                break;
            }

            if (streamInfo.transplant) {
                try {
                    await streamInfo.transplant(streamInfo.dispatcher);
                    continue;
                } catch {
                    break;
                }
            }

            break;
        }

        const size = probeResult?.size;

        if (probeResult?.status !== 200 || !size) {
            return cleanup();
        }

        const generator = readChunks(streamInfo, size);

        const abortGenerator = () => {
            generator.return();
            signal.removeEventListener('abort', abortGenerator);
        }

        signal.addEventListener('abort', abortGenerator);

        const stream = Readable.from(generator);

        if (probeResult.contentType) {
            res.setHeader('content-type', probeResult.contentType);
        }

        pipe(stream, res, cleanup);
    } catch {
        cleanup();
    }
}

async function handleGenericStream(streamInfo, res) {
    const { signal } = streamInfo.controller;
    const cleanup = () => res.end();

    try {
        const fileResponse = await request(streamInfo.url, {
            headers: {
                ...Object.fromEntries(streamInfo.headers),
                host: undefined
            },
            dispatcher: streamInfo.dispatcher,
            signal,
            maxRedirections: 16
        });

        res.status(fileResponse.statusCode);
        fileResponse.body.on('error', () => {});

        const isHls = isHlsResponse(fileResponse, streamInfo);

        for (const [ name, value ] of Object.entries(fileResponse.headers)) {
            if (!isHls || name.toLowerCase() !== 'content-length') {
                res.setHeader(name, value);
            }
        }

        if (fileResponse.statusCode < 200 || fileResponse.statusCode > 299) {
            return cleanup();
        }

        if (isHls) {
            await handleHlsPlaylist(streamInfo, fileResponse, res);
        } else {
            pipe(fileResponse.body, res, cleanup);
        }
    } catch {
        closeRequest(streamInfo.controller);
        cleanup();
    }
}

export function internalStream(streamInfo, res) {
    if (streamInfo.headers) {
        streamInfo.headers.delete('icy-metadata');
    }

    if (serviceNeedsChunks.has(streamInfo.service) && !streamInfo.isHLS) {
        return handleChunkedStream(streamInfo, res);
    }

    return handleGenericStream(streamInfo, res);
}

export async function probeInternalTunnel(streamInfo) {
    try {
        const signal = AbortSignal.timeout(3000);
        const headers = {
            ...Object.fromEntries(streamInfo.headers || []),
            ...getHeaders(streamInfo.service),
            host: undefined,
            range: undefined
        };

        if (streamInfo.isHLS) {
            return probeInternalHLSTunnel({
                ...streamInfo,
                signal,
                headers
            });
        }

        const response = await request(streamInfo.url, {
            method: 'HEAD',
            headers,
            dispatcher: streamInfo.dispatcher,
            signal,
            maxRedirections: 16
        });

        if (response.statusCode !== 200)
            throw "status is not 200 OK";

        const size = +response.headers['content-length'];
        if (isNaN(size))
            throw "content-length is not a number";

        return size;
    } catch {}
}
