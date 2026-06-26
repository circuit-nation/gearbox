# Task 7 Report: Events seed script + public events APIs

**Branch:** `feat/cn-client-backend-integration`  
**Base HEAD:** `ccc68e9`  
**Status:** Complete

## Summary

Implemented events seeding from JSON and two public client APIs for the globe widget: upcoming events and event locations.

## Files Created

| File | Purpose |
|------|---------|
| `src/data/events.json` | Template with `REPLACE_WITH_*` placeholders for sport/circuit ObjectIds |
| `scripts/seed-events.ts` | Validates refs, upserts events, syncs EventLinks |
| `src/lib/events/globe-mapper.ts` | `resolveWatchFields`, `parsePopulatedEvent`, `mapEventToGlobeEvent`, `mapEventToLocation` |
| `src/lib/events/globe-mapper.test.ts` | Unit tests for `resolveWatchFields` |
| `src/app/api/events/upcoming/route.ts` | Public GET with Bearer token auth |
| `src/app/api/events/locations/route.ts` | Public GET with Bearer token auth |

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Added `seed:events` script; expanded `test` glob to `src/lib/**/*.test.ts` |

## Unchanged (already present)

- `src/proxy.ts` — `/api/events/upcoming` and `/api/events/locations` already whitelisted in `PUBLIC_CLIENT_API_PREFIXES`

## API Behavior

### `GET /api/events/upcoming`

- **Auth:** `Authorization: Bearer ${CN_CLIENT_API_TOKEN}` (401 if missing/invalid)
- **Query:** `limit` (default 3, max 10)
- **Filter:** `event_end_at >= now`
- **Sort:** `event_start_at` ascending
- **Populate:** `sport_id`, `circuit_id`, `links_id`
- **Response:** `{ data: GlobeEvent[] }`

### `GET /api/events/locations`

- **Auth:** Same Bearer token requirement
- **Filter:** All upcoming events (`event_end_at >= now`)
- **Populate:** `circuit_id`
- **Filter post-map:** Excludes events where circuit lat/lng are both 0
- **Response:** `{ data: EventLocation[] }` with `{ eventId, title, latitude, longitude }`

## Seed Script

```bash
pnpm seed:events
```

- Reads `src/data/events.json`
- Validates each `sport_id` / `circuit_id` via `SportModel.findById` / `CircuitModel.findById` (exit 1 on missing ref)
- Validates payload with `eventSchema`
- Upserts by composite key `(title, round, sport_id)`; optional `seed_key` enables fallback lookup by `(seed_key, round, sport_id)` for stable re-seeds after title changes
- Uses `syncEventLinks` preserving `watch_url`, `watch_label`, and `youtube`

## Tests

```
pnpm test
# 30 tests, 0 failures (includes 2 new resolveWatchFields tests)
```

## Concerns / Follow-ups

1. **Placeholder IDs in `events.json`** — User must replace `REPLACE_WITH_SPORT_OBJECT_ID` and `REPLACE_WITH_CIRCUIT_OBJECT_ID` with real MongoDB ObjectIds from seeded sports/circuits before running `pnpm seed:events`.
2. **No integration tests** — API routes are not covered by automated tests; manual verification with a valid Bearer token recommended.
3. **`seed_key` semantics** — Fallback lookup only matches events previously seeded with `title === seed_key`; composite key remains the primary upsert identity.

## Manual Verification Checklist

- [ ] Set `CN_CLIENT_API_TOKEN` in env
- [ ] Replace placeholder ObjectIds in `events.json`
- [ ] Run `pnpm seed:events`
- [ ] `curl -H "Authorization: Bearer $CN_CLIENT_API_TOKEN" http://localhost:3000/api/events/upcoming`
- [ ] `curl -H "Authorization: Bearer $CN_CLIENT_API_TOKEN" http://localhost:3000/api/events/locations`
