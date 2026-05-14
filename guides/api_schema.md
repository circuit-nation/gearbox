# API Request and Response Schemas

This document outlines request and response schemas for the HTTP API, aligned with the Go server in `server/internal/server/server.go`.

## Base path and route index

**Prefix:** Most JSON APIs live under **`/api/v1`**. The process health check is **`GET /health`** (no version prefix).

| Method   | Path                                             | Auth                                |
| -------- | ------------------------------------------------ | ----------------------------------- |
| `POST`   | `/api/v1/admin/lists`                            | HTTP Basic (admin)                  |
| `POST`   | `/api/v1/admin/entities`                         | HTTP Basic                          |
| `POST`   | `/api/v1/admin/lists/:listId/entities`           | HTTP Basic                          |
| `PATCH`  | `/api/v1/admin/lists/:listId/entities/order`     | HTTP Basic                          |
| `DELETE` | `/api/v1/admin/lists/:listId/entities/:entityId` | HTTP Basic                          |
| `PATCH`  | `/api/v1/admin/lists/:listId/archive`            | HTTP Basic                          |
| `PATCH`  | `/api/v1/admin/lists/:listId`                    | HTTP Basic                          |
| `DELETE` | `/api/v1/admin/lists/:listId`                    | HTTP Basic                          |
| `PATCH`  | `/api/v1/admin/entities/:id`                     | HTTP Basic                          |
| `DELETE` | `/api/v1/admin/entities/:id`                     | HTTP Basic                          |

**Bearer JWT:** Send `Authorization: Bearer <access_token>`.

**Admin HTTP Basic:** Send `Authorization: Basic <base64(username:password)>` per server configuration.

**Note:** Gin requires a single wildcard name per path segment under `/admin/lists/`. All admin list routes use the parameter name **`listId`** (not `id`) for the tier list UUID in that segment.

---

## Database Schemas

### Entity

- `id`: string
- `name`: string
- `description`: string
- `team`: string (optional)
- `tags`: array of strings
- `imageUrl`: string (optional)

### List

- `id`: string
- `name`: string
- `description`: string
- `coverImage`: string
- `tiersConfig`: object (contains `tiers` and potentially scores)
  - `tiers`: array of Tier objects
    - `value`: number (enum: 1–7)
    - `label`: string (enum: S, A, B, C, D, E, F)
- `isLocked`: boolean
- `isVisible`: boolean
- `startTime`: string (ISO 8601 datetime, optional)
- `endTime`: string (ISO 8601 datetime, optional)
- `createdBy`: string (user ID, optional)
- `archivedAt`: string (ISO 8601 datetime, optional) — set when a list is archived (soft delete)

### Tiers in the Config

- `tiers`: array of Tier objects
  - `value`: number (enum: 1–7)
  - `label`: string (enum: S, A, B, C, D, E, F)

### Vote

- `id`: string
- `userId`: string
- `listId`: string
- `entityId`: string
- `isAnonymous`: boolean
- `tierValue`: number (enum: 1–7)
- `createdAt`: string (ISO 8601 datetime)
- `updatedAt`: string (ISO 8601 datetime)

### Submission

- `id`: string
- `listId`: string
- `userId`: string
- `isAnonymous`: boolean
- `createdAt`: string (ISO 8601 datetime)
- `updatedAt`: string (ISO 8601 datetime)

---

## 1. Health

### 1.1. Process health

**Endpoint:** `GET /health`

**Description:** Liveness check for load balancers and ops.

**Request:** No body.

**Response:** `200 OK`

```json
{
  "status": "ok"
}
```

---

## 2. Authentication (`/api/v1/auth`)

### 2.1. Google OAuth login

**Endpoint:** `GET /api/v1/auth/google/login`

**Description:** Redirects the browser to Google’s consent screen.

**Response:** `307 Temporary Redirect` to Google.

---

### 2.2. Google OAuth callback

**Endpoint:** `GET /api/v1/auth/google/callback?code=...`

**Description:** Exchanges `code` for tokens, creates/refreshes the user and session, sets an HTTP-only `refresh_token` cookie, and redirects to the web client with `access_token` in the query string (`{clientURL}/auth/callback?access_token=...`).

**Errors:** `400` if `code` is missing; `500` on upstream or persistence failures (`{"error":"..."}`).

---

### 2.3. Refresh access token

**Endpoint:** `POST /api/v1/auth/refresh`

**Request body:**

```json
{
  "refresh_token": "string"
}
```

**Response:** `200 OK`

```json
{
  "access_token": "string"
}
```

**Errors:** `401` if the refresh token is missing or invalid.

---

### 2.4. Logout (invalidate refresh session)

**Endpoint:** `POST /api/v1/auth/logout`

**Request body:**

```json
{
  "refresh_token": "string"
}
```

**Response:** `200 OK`

```json
{
  "message": "logged out successfully"
}
```

**Errors:** `400` if body invalid; `500` on server errors.

---

## 3. Public APIs (lists)

### 3.1. Get all voting lists

**Endpoint:** `GET /api/v1/lists?page=1&limit=10`

**Description:** Paginated visible, non-archived lists.

**Request:** No body. Query: `page` (default `1`), `limit` (default `10`, max `100`).

**Response:** `200 OK`

```json
{
  "lists": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "coverImage": "string",
      "tiersConfig": {
        "tiers": [
          {
            "value": "number (1-7)",
            "label": "string (S, A, B, C, D, E, F)"
          }
        ]
      },
      "isLocked": "boolean",
      "isVisible": "boolean",
      "startTime": "string (ISO 8601) or null",
      "endTime": "string (ISO 8601) or null",
      "createdBy": "string or null"
    }
  ]
}
```

---

### 3.2. Get one tier list (with entities)

**Endpoint:** `GET /api/v1/lists/:id`

**Description:** Returns a visible, non-archived list and its entities (ordered by `sort_order`).

**Response:** `200 OK` — list fields match **3.1**, plus:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "coverImage": "string",
  "tiersConfig": { "tiers": [] },
  "isLocked": "boolean",
  "isVisible": "boolean",
  "startTime": "string or null",
  "endTime": "string or null",
  "createdBy": "string or null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "entities": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "team": "string",
      "tags": ["string"],
      "imageUrl": "string (optional)"
    }
  ]
}
```

**Errors:** `400` invalid id; `404` list not found or not public.

---

## 4. Authenticated APIs (Bearer JWT)

All routes in this section require `Authorization: Bearer <access_token>`.

### 4.1. Current user

**Endpoint:** `GET /api/v1/me`

**Response:** `200 OK`

```json
{
  "user": {
    "id": "string",
    "google_id": "string",
    "email": "string",
    "name": "string",
    "avatar_url": "string",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:** `404` user not found.

---

### 4.2. Create submission record

**Endpoint:** `POST /api/v1/submissions`

**Description:** Records that the authenticated user is submitting for a list (required before posting votes). If a submission already exists for this user and list, returns `200` with the existing row.

**Request body:**

```json
{
  "listId": "string",
  "isAnonymous": "boolean"
}
```

**Response:** `201 Created` (new) or `200 OK` (already existed)

```json
{
  "id": "string",
  "listId": "string",
  "userId": "string",
  "isAnonymous": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

**Errors:** `400` validation; `404` list not found / not public.

---

### 4.3. Submit votes

**Endpoint:** `POST /api/v1/votes`

**Description:** Replaces this user’s votes for the list in one transaction. Requires an existing submission (**4.2**). `userId` is taken from the JWT, not the body.

**Request body:**

```json
{
  "listId": "string",
  "isAnonymous": "boolean",
  "votes": [
    {
      "entityId": "string",
      "tierValue": "number (1-7)",
      "placementOrder": "number (optional)"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "message": "votes submitted"
}
```

**Errors:** `400` validation, submission missing, voting window/lock, invalid tier, entity not on list; `404` list not found.

---

### 4.4. List average score

**Endpoint:** `GET /api/v1/lists/:id/average-score`

**Response:** `200 OK`

```json
{
  "listId": "string",
  "averageScore": "number"
}
```

**Errors:** `400` invalid id; `404` list not found.

---

### 4.5. Per-entity averages on a list

**Endpoint:** `GET /api/v1/lists/:id/entity-averages`

**Response:** `200 OK`

```json
{
  "entityAverages": [
    {
      "entityId": "string",
      "averageTierValue": "number",
      "voteCount": "number"
    }
  ]
}
```

**Errors:** `400` invalid id; `404` list not found.

---

## 5. Admin APIs (`/api/v1/admin`)

HTTP Basic authentication on every route in this section.

Admin list paths use **`{listId}`** as the path parameter name in URLs (see route index).

### 5.1. Create tier list

**Endpoint:** `POST /api/v1/admin/lists`

**Request body:**

```json
{
  "name": "string",
  "description": "string",
  "coverImage": "string",
  "tiersConfig": {
    "tiers": [
      {
        "value": "number (1-7)",
        "label": "string (S, A, B, C, D, E, F)"
      }
    ]
  },
  "isLocked": "boolean",
  "isVisible": "boolean",
  "startTime": "string (ISO 8601) or null",
  "endTime": "string (ISO 8601) or null"
}
```

**Response:** `201 Created` — full list object (`id`, `tiersConfig`, `createdAt`, `updatedAt`, `createdBy`, etc.).

**Errors:** `400` invalid `tiersConfig` or validation.

---

### 5.2. Add entities to a tier list

**Endpoint:** `POST /api/v1/admin/lists/:listId/entities`

**Description:** Creates new entities and attaches them to the list (append order).

**Request body:**

```json
{
  "entities": [
    {
      "name": "string",
      "team": "string",
      "tags": ["string"],
      "imageUrl": "string (optional)",
      "description": "string (optional)"
    }
  ]
}
```

**Response:** `200 OK` — `{"message":"entities added to list"}`

**Errors:** `400` / `404` / `500` as applicable.

---

### 5.3. Create entities (standalone)

**Endpoint:** `POST /api/v1/admin/entities`

**Request body:**

```json
{
  "entities": [
    {
      "name": "string",
      "team": "string",
      "tags": ["string"],
      "imageUrl": "string (optional)",
      "description": "string (optional)"
    }
  ]
}
```

**Response:** `200 OK` — `{"message":"entities created"}`

---

### 5.4. Archive tier list (soft delete)

**Endpoint:** `PATCH /api/v1/admin/lists/:listId/archive`

**Description:** Sets `archivedAt`. Archived lists no longer appear in public list/detail flows.

**Request:** No body.

**Response:** `200 OK` — `{"message":"list archived"}`

**Errors:** `400` invalid list id; `404` list not found.

---

### 5.5. Update tier list (partial)

**Endpoint:** `PATCH /api/v1/admin/lists/:listId`

**Description:** Only sent JSON fields are updated. `tiersConfig`, if present, must still parse as a valid tiers payload.

**Request body (all optional):**

```json
{
  "name": "string",
  "description": "string",
  "coverImage": "string",
  "tiersConfig": {
    "tiers": [
      {
        "value": "number (1-7)",
        "label": "string (S, A, B, C, D, E, F)"
      }
    ]
  },
  "isLocked": "boolean",
  "isVisible": "boolean",
  "startTime": "string (ISO 8601) or null",
  "endTime": "string (ISO 8601) or null"
}
```

**Response:** `200 OK` — full list JSON (includes `archivedAt` when set).

**Errors:** `400` invalid id or body; `404` list not found.

---

### 5.6. Delete tier list (hard delete)

**Endpoint:** `DELETE /api/v1/admin/lists/:listId`

**Description:** Deletes votes and submissions for the list, removes `list_entity` rows, deletes the list, then deletes any entities that are no longer linked to any list.

**Response:** `204 No Content`

**Errors:** `400` invalid id; `404` list not found; `500` server error.

---

### 5.7. Update entity (partial)

**Endpoint:** `PATCH /api/v1/admin/entities/:id`

**Request body (all optional):**

```json
{
  "name": "string",
  "description": "string",
  "team": "string",
  "tags": ["string"],
  "imageUrl": "string or null"
}
```

**Response:** `200 OK` — full entity (`id`, `name`, `description`, `team`, `tags`, `imageUrl`, `createdAt`, `updatedAt`).

**Errors:** `400` invalid id; `404` entity not found.

---

### 5.8. Remove entity from list

**Endpoint:** `DELETE /api/v1/admin/lists/:listId/entities/:entityId`

**Description:** Deletes the `list_entity` row and votes for that `(listId, entityId)` pair. Does **not** delete the global entity row.

**Response:** `204 No Content`

**Errors:** `400` invalid UUIDs; `404` `{"error":"list not found"}` or `{"error":"entity not on this list"}`.

---

### 5.9. Delete entity (global)

**Endpoint:** `DELETE /api/v1/admin/entities/:id`

**Description:** Deletes all votes and list links for that entity, then the entity.

**Response:** `204 No Content`

**Errors:** `400` invalid id; `404` entity not found.

---

### 5.10. Reorder entities on a list

**Endpoint:** `PATCH /api/v1/admin/lists/:listId/entities/order`

**Description:** Body must include **every** entity on the list exactly once, with unique non-negative `sortOrder` values.

**Request body:**

```json
{
  "order": [
    {
      "entityId": "string",
      "sortOrder": "number (non-negative integer)"
    }
  ]
}
```

**Response:** `200 OK` — `{"message":"entity order updated"}`

**Errors:** `400` validation (duplicates, unknown entity, wrong count, etc.); `404` list not found.
