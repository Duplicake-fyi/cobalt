import { device } from "$lib/device";
import env, { officialApiURL } from "$lib/env";
import { defaultLocale } from "$lib/i18n/translations";
import type { CobaltSettings } from "$lib/types/settings";

const defaultLocalProcessing =
    device.supports.defaultLocalProcessing && env.DEFAULT_API === officialApiURL
        ? "preferred"
        : "disabled";

const defaultSettings: CobaltSettings = {
    schemaVersion: 6,
    advanced: {
        debug: false,
        useWebCodecs: false,
    },
    appearance: {
        theme: "auto",
        language: defaultLocale,
        autoLanguage: true,
        hideRemuxTab: false,
    },
    accessibility: {
        reduceMotion: false,
        reduceTransparency: false,
        disableHaptics: false,
        dontAutoOpenQueue: false,
    },
    save: {
        alwaysProxy: false,
        localProcessing: defaultLocalProcessing,
        audioBitrate: "128",
        audioFormat: "mp3",
        disableMetadata: false,
        downloadMode: "auto",
        filenameStyle: "basic",
        savingMethod: "download",
        allowH265: false,
        tiktokFullAudio: false,
        convertGif: true,
        videoQuality: "1080",
        subtitleLang: "none",
        youtubeVideoCodec: "h264",
        youtubeVideoContainer: "auto",
        youtubeDubLang: "original",
        youtubeHLS: false,
        youtubeBetterAudio: false,
    },
    privacy: {
        disableAnalytics: false,
    },
    processing: {
        customInstanceURL: "",
        customApiKey: "",
        enableCustomInstances: false,
        enableCustomApiKey: false,
        seenCustomWarning: false,
    }
}

export default defaultSettings;
