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
3. Set `ADMIN_PASSWORD` in Vercel project env.
4. At SiteGround DNS, add Vercel’s records for `WarcraftEvents.com` (and `www`). Leave SiteGround mail records alone if you still use that email.

Until a database is attached, the store is a JSON file locally and **in-memory on Vercel** (cold starts reset data). Neon Postgres is the next persistence step.

## Addon → site

WoW cannot HTTP. In game:

```
/ard upload
```

Paste the `ARDU1` JSON at `/ladder/upload` or `POST /api/ard/upload`.

The site is source of truth:

- Unique key is addon `matchId` (`sortedNameA|sortedNameB|mode|unix/5`), not an incrementing counter.
- A match is **confirmed** when two different reporters upload it, or when `reporterIsHub` is true.
- Ratings are recomputed on the server (start 1500, K=24). In-game points are ignored as truth.

## Admin

Set `ADMIN_PASSWORD`, then `/admin` to publish or reject calendar submissions.

Event organizers get a one-time `?key=` link to edit the bracket whiteboard.
