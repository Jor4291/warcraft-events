# WarcraftEvents Arena uploader

A local watcher, same idea as the Warcraft Logs client: WoW writes a file, this app POSTs it.

It does **not** read the combat log. It reads `WTF\Account\<account>\SavedVariables\ArenaRankedDuels.lua` and sends the addon’s `uploadJson` (ARDU1) to `POST /api/ard/upload`.

## Players

Download [WarcraftEventsUploader.exe](https://github.com/Jor4291/warcraft-events/releases/download/uploader/WarcraftEventsUploader.exe). Double-click it. Site URL defaults to `https://warcraftevents.com`. Windows SmartScreen may warn because the exe is unsigned — More info → Run anyway.

GitHub Actions rebuilds that file whenever `companion/` changes on `main`.

## Run from source

From the repo root (with Node on PATH):

```bash
npm run uploader:embed
npm run uploader
```

Or double-click `companion\start-uploader.bat`.

It opens `http://127.0.0.1:4782`.

1. Sign in on WarcraftEvents → Account → create an uploader token.
2. Paste the token here. Site URL is `http://localhost:3000` while developing, `https://warcraftevents.com` in the packaged exe.
3. Scan for SavedVariables. After a rated session, `/reload` or log out so WoW flushes the file.

After editing `companion/public/index.html`, run `npm run uploader:embed`.

Anonymous paste on the website still works. Hub confirmation is **not** taken from the addon JSON; only a token on a `HUB_NAMES` account (default `Sgtpepper`) is trusted as hub.

## Flush timing

SavedVariables update on logout / reload, not on every duel. Live ladder mid-fight is not this first version.
