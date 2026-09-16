# WarcraftEvents

Public Warcraft events calendar, tournament bracket board, and the **WoW:Forever Arena Ranked Duels** ladder.

Local folder: `C:\Users\jor42\warcraft-events`

## Why Vercel (not SiteGround Actions)

SiteGround is a good place to **keep the domain and email**. It is a poor host for this app: Next.js needs server routes for event submissions, admin, and `ARDU1` ingest. A GitHub Action that FTPs files to SiteGround only works for static HTML.

The easier loop is:

**Cursor → GitHub (`main`) → Vercel production**

Preview URLs come free on every pull request. Point `WarcraftEvents.com` DNS at Vercel when you are ready to replace the SiteGround sitebuilder.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub + Vercel

1. Repo is created from this folder.
2. [vercel.com/new](https://vercel.com/new) → import the GitHub repo.
3. Set `ADMIN_PASSWORD`, `HUB_NAMES`, and `DATABASE_URL` in Vercel project env.
4. At SiteGround DNS, add Vercel’s records for `WarcraftEvents.com` (and `www`). Leave SiteGround mail records alone if you still use that email.

## Database (Neon)

Set `DATABASE_URL` to a Neon pooled connection string (`...neon.tech/...sslmode=require`). The app creates tables on first read. Without `DATABASE_URL`, local still uses `data/store.json`.

To copy your current local JSON into Neon:

```bash
npm run db:migrate
```

## Addon → site

WoW cannot HTTP. Two ways to get `ARDU1` onto the ladder:

1. **Uploader (preferred)** — `npm run uploader` or `companion/start-uploader.bat`. Sign in on the site, create a token on `/account`, paste it into the local app. It watches `ArenaRankedDuels.lua`. After a session, `/reload` or log out so SavedVariables flush.
2. **Paste** — `/ard upload` in game, then `/ladder/upload`.

`POST /api/ard/upload` accepts the JSON. Send `Authorization: Bearer weu_…` from the uploader.

The site is source of truth:

- Unique key is addon `matchId` (`sortedNameA|sortedNameB|mode|unix/5`), not an incrementing counter.
- A match is **confirmed** when two different reporters upload it, or when a **hub token** uploads it. The addon’s `reporterIsHub` flag is ignored.
- Ratings are recomputed on the server (start 1500, K=24). In-game points are ignored as truth.

## Admin

Set `ADMIN_PASSWORD`, then `/admin` to publish or reject calendar submissions.

Event organizers get a one-time `?key=` link to edit the bracket whiteboard.
