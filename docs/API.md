# Clutch.gg -- API Reference

> Base URL: all endpoints are prefixed with `/api` except `/health`.
>
> Authentication: endpoints marked **Bearer** require an `Authorization: Bearer <access_token>` header.
> Endpoints marked **@Public** do not require authentication.
> Rate limiting is applied globally; specific stricter limits are noted where applicable.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | @Public | Health check (database + Redis). Returns `healthy` or `degraded`. |

> Note: `/health` has **no** `/api` prefix.

---

## Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | @Public | Register a new account (rate-limited: 5 req / 15 min) |
| POST | `/api/auth/login` | @Public | Login with email + password (rate-limited: 5 req / 15 min) |
| POST | `/api/auth/google` | @Public | Login/register with Google ID token |
| POST | `/api/auth/refresh` | Refresh token | Refresh access + refresh tokens |
| POST | `/api/auth/logout` | Bearer | Invalidate refresh token |
| GET | `/api/auth/me` | Bearer | Get authenticated user profile |

### POST `/api/auth/register`

**Request:**

```json
{
  "email": "player@example.com",
  "password": "securepass8+",
  "name": "Carlos Lopez"
}
```

**Validation:** email (valid email), password (8-128 chars), name (2-50 chars).

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "player@example.com",
    "name": "Carlos Lopez",
    "mmr": 1000
  }
}
```

### POST `/api/auth/login`

**Request:**

```json
{
  "email": "player@example.com",
  "password": "securepass8+"
}
```

**Response (200):** same shape as register.

### POST `/api/auth/google`

**Request:**

```json
{
  "idToken": "google-oauth-id-token-string"
}
```

**Response (200):** same shape as register/login.

---

## Users (`/api/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | Bearer | Get current user profile |
| PATCH | `/api/users/me` | Bearer | Update current user profile |
| GET | `/api/users/me/history` | Bearer | Get MMR/Elo history (last 50 entries) |
| PATCH | `/api/users/me/avatar` | Bearer | Upload avatar image (multipart, max 5 MB) |
| PATCH | `/api/users/me/preferences` | Bearer | Update notification preferences |
| DELETE | `/api/users/me` | Bearer | Soft-delete account (anonymizes data) |
| GET | `/api/users/search?q=&limit=` | @Public | Search users by name (min 2 chars, max 20 results) |
| GET | `/api/users/leaderboard?limit=` | @Public | Global MMR leaderboard (max 100) |
| GET | `/api/users/:id` | @Public | Get public profile by user ID |

---

## Matches (`/api/matches`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/matches` | Bearer | Create a new match |
| GET | `/api/matches` | @Public | List matches (supports geo-query or status filter) |
| GET | `/api/matches/:id` | @Public | Get match details |
| POST | `/api/matches/:id/join` | Bearer | Join a match |
| POST | `/api/matches/:id/leave` | Bearer | Leave a match |
| POST | `/api/matches/:id/confirm` | Bearer | Confirm attendance |
| DELETE | `/api/matches/:id` | Bearer | Delete match (creator only, must be alone) |

### POST `/api/matches` -- Create Match

**Request:**

```json
{
  "dateTime": "2026-04-15T18:00:00.000Z",
  "courtName": "Cancha Municipal Norte",
  "courtLat": 10.4806,
  "courtLng": -66.9036,
  "maxPlayers": 10
}
```

**Validation:** dateTime (ISO date), courtName (1-200 chars), courtLat (-90..90), courtLng (-180..180), maxPlayers (2-30, default 10).

**Response (201):**

```json
{
  "id": "uuid",
  "creatorId": "uuid",
  "dateTime": "2026-04-15T18:00:00.000Z",
  "courtName": "Cancha Municipal Norte",
  "courtLat": 10.4806,
  "courtLng": -66.9036,
  "maxPlayers": 10,
  "status": "open",
  "createdAt": "2026-04-11T12:00:00.000Z"
}
```

### GET `/api/matches` -- Find Matches

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `lat` | number | -- | Latitude for geo-search |
| `lng` | number | -- | Longitude for geo-search |
| `radius` | number | 5000 | Radius in meters (100-50000) |
| `status` | string | `open` | Filter by match status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max 50) |

### POST `/api/matches/:id/join`

**Request:** no body required. Uses authenticated user from token.

**Response (200):**

```json
{
  "matchId": "uuid",
  "userId": "uuid",
  "joined": true
}
```

---

## Voting (`/api/matches/:id/vote`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/matches/:id/vote` | Bearer | Submit match result vote (`team_a` or `team_b`) |
| GET | `/api/matches/:id/votes` | @Public | Get all votes for a match |

### POST `/api/matches/:id/vote`

**Request:**

```json
{
  "vote": "team_a"
}
```

**Validation:** vote must be `"team_a"` or `"team_b"`.

**Response (200):**

```json
{
  "matchId": "uuid",
  "userId": "uuid",
  "vote": "team_a"
}
```

---

## Conduct (`/api/matches/:id/rate`, `/api/users/:id/conduct`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/matches/:id/rate` | Bearer | Rate player conduct after a match |
| GET | `/api/users/:id/conduct` | @Public | Get a user's conduct score |

### POST `/api/matches/:id/rate`

**Request:**

```json
{
  "ratings": [
    { "userId": "uuid-player-1", "score": 5 },
    { "userId": "uuid-player-2", "score": 3 }
  ]
}
```

**Validation:** ratings is an array of `{ userId: UUID, score: 1-5 }`.

**Response (200):**

```json
{
  "matchId": "uuid",
  "ratingsSubmitted": 2
}
```

---

## Friends (`/api/friends`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/friends/request` | Bearer | Send a friend request |
| GET | `/api/friends` | Bearer | List accepted friends |
| GET | `/api/friends/requests` | Bearer | List pending friend requests |
| POST | `/api/friends/:id/accept` | Bearer | Accept a friend request |
| POST | `/api/friends/:id/reject` | Bearer | Reject a friend request |
| DELETE | `/api/friends/:id` | Bearer | Remove a friend |

> All friends endpoints require Bearer authentication.

---

## Squads (`/api/squads`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/squads` | Bearer | Create a squad |
| GET | `/api/squads` | @Public | List all squads |
| GET | `/api/squads/me` | Bearer | Get current user's squad |
| GET | `/api/squads/:id` | @Public | Get squad details |
| POST | `/api/squads/:id/join` | Bearer | Join a squad |
| DELETE | `/api/squads/:id/leave` | Bearer | Leave a squad |

---

## Courts (`/api/courts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/courts` | @Public | List/search courts (supports geo-query) |
| GET | `/api/courts/:id` | @Public | Get court details |
| POST | `/api/courts` | Bearer | Create a new court |
| PATCH | `/api/courts/:id` | Bearer | Update court info |
| DELETE | `/api/courts/:id` | Bearer | Deactivate a court |

---

## Config (`/api/config`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/config` | @Public | Get all config parameters |
| GET | `/api/config/:key` | @Public | Get a single config parameter by key |

---

## Error Responses

All errors follow a consistent shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| 400 | Validation error / bad request |
| 401 | Missing or invalid token |
| 403 | Forbidden (not authorized for this action) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
