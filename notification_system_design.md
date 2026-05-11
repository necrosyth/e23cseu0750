# Stage 1 — REST API Design

## Core Actions
- Get all notifications for a student (with pagination and type filter)
- Get one notification by ID
- Mark a notification as read
- Mark all notifications as read at once
- Get unread count (for the badge on the bell icon)
- Create a new notification (admin only)

## REST Endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | /api/v1/notifications | list all, supports `?page`, `?limit`, `?type` |
| GET | /api/v1/notifications/:id | single notification detail |
| PATCH | /api/v1/notifications/:id/read | mark one as read |
| PATCH | /api/v1/notifications/read-all | mark all as read for this student |
| GET | /api/v1/notifications/count | get unread count |
| POST | /api/v1/notifications | create notification (admin) |
| GET | /api/v1/notifications/stream | SSE stream for real-time updates |

## Request & Response Contracts

Headers for all endpoints:
- Authorization: Bearer `<token>`
- Content-Type: application/json

### GET /api/v1/notifications
Request body: none

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "n1",
      "studentId": 1042,
      "type": "Placement",
      "message": "New hiring drive live now",
      "isRead": false,
      "createdAt": "2026-05-11T09:15:00Z",
      "updatedAt": "2026-05-11T09:15:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 10
}
```

### GET /api/v1/notifications/:id
Request body: none

Response:
```json
{
  "success": true,
  "data": {
    "id": "n1",
    "studentId": 1042,
    "type": "Event",
    "message": "Seminar starts at 5 PM",
    "isRead": false,
    "createdAt": "2026-05-11T09:15:00Z",
    "updatedAt": "2026-05-11T09:15:00Z"
  }
}
```

### PATCH /api/v1/notifications/:id/read
Request body:
```json
{}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "n1",
    "studentId": 1042,
    "type": "Result",
    "message": "Result published",
    "isRead": true,
    "createdAt": "2026-05-11T09:15:00Z",
    "updatedAt": "2026-05-11T10:00:00Z"
  }
}
```

### PATCH /api/v1/notifications/read-all
Request body:
```json
{}
```

Response:
```json
{
  "success": true,
  "data": {
    "updatedCount": 18
  }
}
```

### GET /api/v1/notifications/count
Request body: none

Response:
```json
{
  "success": true,
  "data": {
    "count": 18
  }
}
```

### POST /api/v1/notifications
Request body:
```json
{
  "studentId": 1042,
  "type": "Event",
  "message": "Guest lecture at 4 PM"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "n99",
    "studentId": 1042,
    "type": "Event",
    "message": "Guest lecture at 4 PM",
    "isRead": false,
    "createdAt": "2026-05-11T11:00:00Z",
    "updatedAt": "2026-05-11T11:00:00Z"
  }
}
```

### GET /api/v1/notifications/stream
Request body: none

Response:
```json
{
  "success": true,
  "data": "SSE stream opened"
}
```

## Real-Time Notifications — SSE
WebSockets are two-way. Useful when client also needs to send live stuff back.
For notifications here, server only pushes updates, so SSE fits better.

Why SSE is nice:
- plain HTTP, simple setup
- browser auto reconnect is built-in
- less moving pieces for this use case

Flow:
- Student opens app, client connects to `GET /api/v1/notifications/stream`
- Server keeps the connection open and pushes `text/event-stream`
- Server keeps a `Map` of `studentId -> open response`
- New notification gets created
- Service finds that student stream and writes event
- Client gets event and updates UI, no polling

Sample SSE event:
```text
event: notification
data: {"id":"abc123","type":"Placement","message":"Google hiring","isRead":false,"createdAt":"2026-05-11T11:30:00Z"}
```

# Stage 2 — Database Design

## Why PostgreSQL
- Notifications have clear structure: one student can have many notifications.
- We need filtering, sorting, and pagination. SQL does this well.
- ACID safety matters. A notification should not get lost in middle of write.
- PostgreSQL can scale with read replicas later.
- JSONB support is there if we add extra metadata in future.

## Schema
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Placement', 'Event', 'Result')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- index on unread notifications per student
CREATE INDEX idx_unread_notifs
ON notifications (student_id, created_at DESC)
WHERE is_read = FALSE;
```

## Problems at Scale
- Slow queries: at 5 million rows, even indexed reads can get slower.
- Write bottleneck: big bulk inserts update indexes again and again.
- Table bloat: old read notifications keep growing and eat space.

## Solutions
### 1) Partition by month
```sql
CREATE TABLE notifications_partitioned (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Placement', 'Event', 'Result')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE notifications_2026_05
PARTITION OF notifications_partitioned
FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```
Old partitions can be detached + archived without touching live month.

### 2) Read replicas
- Send all SELECT traffic to replica.
- Keep INSERT/UPDATE/DELETE on primary.
- App logic mostly same, only read DB connection changes.

### 3) Archive old data
- Move notifications older than 90 days to `cold_notifications`.
- Or export old chunks to object storage like S3.
- Live table stays lean and fast.

## Queries for Each API
```sql
-- Paginated list with optional type filter
SELECT * FROM notifications
WHERE student_id = $1
  AND ($2::text IS NULL OR type = $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- Mark one as read
UPDATE notifications
SET is_read = TRUE, updated_at = NOW()
WHERE id = $1 AND student_id = $2;

-- Mark all as read
UPDATE notifications
SET is_read = TRUE, updated_at = NOW()
WHERE student_id = $1 AND is_read = FALSE;

-- Unread count
SELECT COUNT(*) FROM notifications
WHERE student_id = $1 AND is_read = FALSE;

-- Insert notification (admin)
INSERT INTO notifications (student_id, type, message)
VALUES ($1, $2, $3)
RETURNING *;
```

# Stage 3 — Query Performance

## Is the Original Query Correct?
Original query:
```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;
```

Not really correct for PostgreSQL in this schema.
Our table uses `student_id`, `is_read`, `created_at` (snake_case), not camelCase.
So this query can fail with "column does not exist".

Also `SELECT *` is not ideal. It pulls everything even when we only need a few fields.

## Why Is It Slow?
- Table has 5 million rows.
- If there is no good combined index for `student_id` + `is_read`, DB may scan huge data.
- Even with single-column index, planner may still choose seq scan depending on row distribution.

## What to Fix
Use a partial index only for unread rows. That keeps index smaller.

```sql
CREATE INDEX idx_student_unread ON notifications (student_id, created_at DESC)
WHERE is_read = FALSE;
```

Use this improved query:
```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at ASC;
```

Expected result:
- Old query path can touch millions of rows.
- New query uses index scan and only hits unread rows for one student.
- Time can drop from seconds to milliseconds in many cases.

# Stage 4 — Caching and Performance

## The Problem
Right now every refresh hits DB again.
If even 50,000 students are active in placement time, that can mean 50,000 queries around same time.
DB can choke fast, even if each query is not huge.

## Strategy 1 — Redis Cache (best option)
How it works:
- After DB fetch, store response in Redis key like `notifs:<studentId>` with TTL 60 sec
- Next same request checks Redis first
- If cache hit, return directly (skip DB)
- On new notification or mark-read, delete that student's key so next read is fresh

Tradeoffs:
- Big DB relief, cache hit can go very high in normal traffic
- Redis read is super fast
- Need to run/manage Redis infra
- Need careful invalidation logic, else stale data issue
- All backend instances must use same Redis

## Strategy 2 — HTTP Cache Headers
How it works:
- Send `Cache-Control: private, max-age=30` in list response
- Browser keeps response for 30 seconds

Tradeoffs:
- Very easy, almost no backend work
- Reduces repeat calls from same tab
- No proper invalidation, new notif can appear late
- Weak for multi-tab or multi-device case
- Not great with SSE flow

## Strategy 3 — Pagination + Lazy Loading
How it works:
- Load first 20 notifications only
- Load older ones when user scrolls or taps load more

Tradeoffs:
- Smaller payload each request
- No extra infra
- Still queries DB each page load
- Old notifs need extra action to view

## Strategy 4 — Only Load Count on Page Load
How it works:
- On page open, call only `/count`
- Show unread badge number
- Fetch full list only when bell is clicked

Tradeoffs:
- Most page opens avoid heavy list query
- Works nicely with SSE updates for badge
- If user always opens bell instantly, small extra click/wait

## Recommended Approach
Use combo: Redis cache + pagination + lazy fetch.
Why this combo:
- Redis cuts DB pressure
- Pagination keeps each response light
- Lazy fetch avoids list query on every page open
