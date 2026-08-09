# Daily Work Log — Backend API

Hono-based REST API served from the Express server under the base path:

```
/api/v1
```

Local dev: `npm run dev:local` → http://localhost:3000/api/v1

## Data model

### Customer

| Field     | Type   | Required | Notes     |
| --------- | ------ | -------- | --------- |
| `id`      | string | (auto)   | UUID      |
| `name`    | string | yes      |           |
| `phone`   | string | no       |           |
| `photo`   | string | no       | URL/path  |
| `address` | string | no       |           |
| `createdAt`| string | (auto)   | ISO timestamp |
| `updatedAt`| string | (auto)   | ISO timestamp |

### WorkLog

| Field  | Type   | Required | Notes                     |
| ------ | ------ | -------- | ------------------------- |
| `id`   | string | (auto)   | UUID                      |
| `title`| string | yes      |                           |
| `date` | string | yes      | `YYYY-MM-DD`              |
| `desc` | string | no       | description of the log    |
| `targets` | array | no     | list of target customers  |
| `createdAt`| string | (auto) | ISO timestamp            |
| `updatedAt`| string | (auto) | ISO timestamp            |

### TargetCustomer (inside `WorkLog.targets`)

| Field        | Type   | Required | Notes                                              |
| ------------ | ------ | -------- | -------------------------------------------------- |
| `id`         | string | (auto)   | UUID                                               |
| `workLogId`  | string | (auto)   | owning work log                                    |
| `customerId` | string | yes      | must reference an existing customer                |
| `status`     | string | no       | `meet` \| `sell` \| `interesting` \| `not_meet` (default `meet`) |
| `desc`       | string | no       | per-target note                                    |
| `customer`   | object | (auto)   | full Customer object, populated in responses       |

A work log can have **multiple** target customers. When reading work logs, each target is joined with its `customer` object.

## Endpoints

### Service info

`GET /api/v1/` — returns API metadata and whether D1 is configured.

### Seed / reset (dev helpers)

`POST /api/v1/seed` — inserts sample customers and work logs (no-op if data exists).

`POST /api/v1/reset` — deletes all rows from `customers`, `work_logs`, `work_log_targets`.

## Photo uploads

Customer photos are stored in Cloudflare R2. When R2 credentials are not configured, uploads fall back to the local `./data/uploads` folder (used by local dev).

### Upload a photo

`POST /api/v1/uploads` — multipart/form-data with a file field named `photo`.

| Constraint | Value |
| ---------- | ----- |
| Content type | `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/avif` |
| Size limit   | 5 MB |

Response: `201`

```json
{ "data": { "key": "photos_93b75a0c-...png", "url": "/api/v1/uploads/photos_93b75a0c-...png" } }
```

### Serve a photo

`GET /api/v1/uploads/:key` — streams the stored image with `Cache-Control: public, max-age=31536000, immutable`. `404` if the key is missing or invalid.

Store the returned `url` in the customer's `photo` field (`POST/PUT /customers`).

## Customers

### List customers

`GET /api/v1/customers`

| Query    | Type   | Description                            |
| -------- | ------ | -------------------------------------- |
| `search` | string | matches name, phone, or address (LIKE) |

Response: `200`

```json
{
  "data": [
    {
      "id": "93b75a0c-...",
      "name": "Sarah Connor",
      "phone": "+1 555-0100",
      "photo": "https://.../a.png",
      "address": "100 Market St, San Francisco, CA",
      "createdAt": "2026-08-08T14:55:25.056Z",
      "updatedAt": "2026-08-08T14:55:25.056Z"
    }
  ],
  "total": 1
}
```

### Create customer

`POST /api/v1/customers`

```json
{ "name": "Sarah Connor", "phone": "+1 555-0100", "photo": "https://.../a.png", "address": "100 Market St" }
```

Response: `201` with the created customer under `data`. `400` if `name` is missing/invalid.

### Get customer

`GET /api/v1/customers/:id` — `200` with the customer under `data`, `404` if not found.

### Update customer

`PUT /api/v1/customers/:id` — partial update; only provided fields change.

```json
{ "phone": "+1 555-0000", "address": "22 New St" }
```

Response: `200`. `400` if `name` invalid, `404` if not found.

### Delete customer

`DELETE /api/v1/customers/:id` — `200` `{ "success": true, "deleted": true }`.

| Status | Meaning |
| ------ | ------- |
| 404    | customer not found |
| 409    | customer is referenced by work log(s) — remove references first |

### Customer work logs

`GET /api/v1/customers/:id/work-logs` — all work logs where the customer is a target.

Response: `200`

```json
{ "data": [ { "id": "...", "title": "...", "date": "2026-08-08", "targets": [ ... ] } ], "total": 1 }
```

## Work logs

### List work logs

`GET /api/v1/work-logs`

| Query        | Type   | Description                          |
| ------------ | ------ | ------------------------------------ |
| `date`       | string | exact `YYYY-MM-DD` match             |
| `customerId` | string | only logs targeting that customer    |
| `search`     | string | matches `title` or `desc` (LIKE)     |

Response: `200` with logs under `data` (targets joined with customers).

### Create work log

`POST /api/v1/work-logs`

```json
{
  "title": "Client visits",
  "date": "2026-08-08",
  "desc": "Visited three accounts across the city.",
  "targets": [
    { "customerId": "93b75a0c-...", "status": "meet", "desc": "Signed" },
    { "customerId": "9f0c1a2b-...", "status": "sell", "desc": "Awaiting decision" }
  ]
}
```

`targets` is optional; you can add multiple. `status` defaults to `meet`. Response: `201` with the created log under `data`.

| Status | Meaning |
| ------ | ------- |
| 400    | `title` missing, `date` not `YYYY-MM-DD`, target `status` invalid, or target `customerId` does not exist |

### Get work log

`GET /api/v1/work-logs/:id` — `200` with the log under `data`, `404` if not found.

### Update work log

`PUT /api/v1/work-logs/:id` — partial update; only provided fields change. If `targets` is provided, the full target list is **replaced**.

```json
{ "desc": "Updated description" }
```

Response: `200`. `400` on validation errors, `404` if not found.

### Delete work log

`DELETE /api/v1/work-logs/:id` — `200` `{ "success": true, "deleted": true }`, `404` if not found.

## Errors

All error responses use the shape:

```json
{ "error": "<message>" }
```

| Status | Meaning |
| ------ | ------- |
| 400    | validation failed |
| 404    | resource not found |
| 409    | conflict (e.g. deleting a referenced customer) |
| 500    | internal error |
| 503    | D1 not configured (missing `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `CF_D1_DATABASE_ID`) |
