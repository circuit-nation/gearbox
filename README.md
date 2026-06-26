# Gearbox - Circuit Nation and Tier Nation Admin Panel

## Environment variables

Copy `.env.example` to `.env.local` for local development. Production values are set in Netlify site settings.

| Variable | Purpose |
| --- | --- |
| `CN_CLIENT_API_TOKEN` | Bearer token required by cn-client for public read APIs (`GET /api/articles`, `/youtube/videos`, etc.) |
| `CRON_SECRET` | Bearer token for `POST /api/internal/articles/sync`; must match the secret used by the Netlify scheduled function |
| `SUBSTACK_RSS_URL` | RSS feed URL for article sync (defaults to `https://circuitnation.substack.com/feed` when unset) |

## Scheduled RSS sync

Articles are synced from Substack on a Netlify cron schedule (`0 */12 * * *`, every 12 hours UTC). The scheduled function at `netlify/functions/scheduled-rss-sync.ts` calls `POST /api/internal/articles/sync` on the deployed site URL using `CRON_SECRET`. Scheduled functions run only on published production deploys.

## TODO

- Admin
  - [ ] Provide separation based on apps (CN and TN)
- Tier Nation
  - [ ] UI for managing lists and entities
  - [ ] S3 setup for uploading images of entites
  - [ ] create hooks, for using the TN APIs

- Circuit Nation
  - [x] Only Events
  - [ ] Simple leaderboard (F1 and MotoGP)
  - [x] Mongodb collections
    - [x] Sports
    - [x] Events
  - [ ] Social Wall - Bento grid admin (check notes)
  -
