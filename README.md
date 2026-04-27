<div align="center">
    <br/>
    <p>
        <img src="web/static/favicon.png" title="cobalt" alt="cobalt logo" width="100" />
    </p>
    <p>
        best way to save what you love
        <br/>
        <a href="https://cobalt.tools">
            cobalt.tools
        </a>
    </p>
    <p>
        <a href="https://discord.gg/pQPt8HBUPu">
            💬 community discord server
        </a>
        <br/>
        <a href="https://x.com/justusecobalt">
            🐦 twitter
        </a>
        <a href="https://bsky.app/profile/cobalt.tools">
            🦋 bluesky
        </a>
    </p>
    <br/>
</div>

cobalt is a media downloader that doesn't piss you off. it's friendly, efficient, and doesn't have ads, trackers, paywalls or other nonsense.

paste the link, get the file, move on. that simple, just how it should be.

This fork is a modified version to make it wayyyy easier to self host, just paste the docker compose from the code and you're done.
This starts up both a frontend and backend instance.

For normal self-hosted deployments, the frontend now defaults to calling the same origin that served the page. If you want it to talk to a separate API host, set `WEB_DEFAULT_API` at build time.

On self-hosted/community instances, this fork also avoids browser-side "preferred" local processing by default when sending save requests, so standard downloads go through the server tunnel path unless the user explicitly forces local processing.

You can also optionally uncomment the volume mount of the `.png` in the compose and point it at your own image to replace the main download page image above the "community instance" label.


### cobalt monorepo
this monorepo includes source code for api, frontend, and related packages:
- [api tree & readme](/api/)
- [web tree & readme](/web/)
- [packages tree](/packages/)

### ethics
cobalt is a tool that makes downloading public content easier. it takes **zero liability**.
the end user is responsible for what they download, how they use and distribute that content.
cobalt never caches any content, it [works like a fancy proxy](/api/src/stream/).

cobalt is in no way a piracy tool and cannot be used as such.
it can only download free & publicly accessible content.
same content can be downloaded via dev tools of any modern web browser.

### contributing
if you're considering contributing to cobalt, first of all, thank you! check the [contribution guidelines here](/CONTRIBUTING.md) before getting started, they'll help you do your best right away.

### thank you
cobalt is sponsored by [royalehosting.net](https://royalehosting.net/?partner=cobalt). a part of our infrastructure is hosted on their network. we really appreciate their kindness and support!

### licenses
for relevant licensing information, see the [api](api/README.md) and [web](web/README.md) READMEs.
unless specified otherwise, the remainder of this repository is licensed under [AGPL-3.0](LICENSE).
