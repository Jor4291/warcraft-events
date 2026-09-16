# WarcraftEvents Arena uploader

A local watcher, same idea as the Warcraft Logs client: WoW writes a file, this app POSTs it.

It does **not** read the combat log. It reads `WTF\Account\<account>\SavedVariables\ArenaRankedDuels.lua` and sends the addon’s `uploadJson` (ARDU1) to `POST /api/ard/upload`.

## Run

From the repo root (with Node on PATH):

```bash
npm run uploader
```

Or double-click `companion\start-uploader.bat`.

It opens `http://127.0.0.1:4782`.

1. Sign in on WarcraftEvents → Account → create an uploader token.
2. Paste the token here. Site URL is `http://localhost:3000` while developing, later `https://warcraftevents.com`.
3. Scan for SavedVariables. After a rated session, `/reload` or log out so WoW flushes the file.

Anonymous paste on the website still works. Hub confirmation is **not** taken from the addon JSON; only a token on a `HUB_NAMES` account (default `Sgtpepper`) is trusted as hub.

## Flush timing

SavedVariables update on logout / reload, not on every duel. Live ladder mid-fight is not this first version.
