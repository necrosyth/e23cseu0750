# Stage 1 - REST API Design

## 1. Core Actions
- Get all notifcations for one student (with page + limit)
- Get one notifcation detail
- Mark one notifcation as read
- Mark all notifcations as read
- Get unread count
- Send new notifcation (admin only)

## 2. REST Endpoints Table

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/notifications | list all, supports `?page` `?limit` `?type` |
| GET | /api/v1/notifications/:id | get one notifcation |
| PATCH | /api/v1/notifications/:id/read | mark one as read |
| PATCH | /api/v1/notifications/read-all | mark all as read for logged-in student |
| GET | /api/v1/notifications/count | unread count |
| POST | /api/v1/notifications | create notifcation (admin) |

## 3. Request / Response Contracts

### GET /api/v1/notifications
Headers:
- Authorization: Bearer `<token>`
- Content-Type: application/json

Response:
```json
{
  "data": [
    {
      "id": "n1",
      "studentId": 12,
      "type": "Event",
      "message": "Hackathon starts tmrw",
      "isRead": false,
      "createdAt": "2026-05-11T10:10:00Z",
      "updatedAt": "2026-05-11T10:10:00Z"
    }
  ],
  "total": 41,
  "page": 1,
  "limit": 10,
  "success": true
}
```

### GET /api/v1/notifications/:id
Headers same as above.

Response:
```json
{
  "data": {
    "id": "n1",
    "studentId": 12,
    "type": "Placement",
    "message": "New company drive opened",
    "isRead": false,
    "createdAt": "2026-05-11T10:10:00Z",
    "updatedAt": "2026-05-11T10:10:00Z"
  },
  "success": true
}
```

### PATCH /api/v1/notifications/:id/read
Headers same as above.
Request body:
```json
{}
```

Response:
```json
{
  "data": {
    "id": "n1",
    "studentId": 12,
    "type": "Result",
    "message": "Mid sem result out",
    "isRead": true,
    "createdAt": "2026-05-11T10:10:00Z",
    "updatedAt": "2026-05-11T10:20:00Z"
  },
  "success": true
}
```

### PATCH /api/v1/notifications/read-all
Headers same as above.
Request body:
```json
{}
```

Response:
```json
{
  "data": {
    "updated": 14
  },
  "success": true
}
```

### GET /api/v1/notifications/count
Headers same as above.

Response:
```json
{
  "data": {
    "count": 14
  },
  "success": true
}
```

### POST /api/v1/notifications
Headers same as above.
Request body:
```json
{
  "studentId": 12,
  "type": "Event",
  "message": "Guest lecture at 4pm"
}
```

Response:
```json
{
  "data": {
    "id": "n99",
    "studentId": 12,
    "type": "Event",
    "message": "Guest lecture at 4pm",
    "isRead": false,
    "createdAt": "2026-05-11T11:00:00Z",
    "updatedAt": "2026-05-11T11:00:00Z"
  },
  "success": true
}
```

## 4. Real-Time Notification Design
Two ways: WebSockets or SSE.

I’d pick SSE here. Reason is simple. We only push from server to client, no two-way chat thing needed. So SSE is lighter, easier to scale.

Flow is like this:
- Student opens notifcation page
- Client connects to `GET /api/v1/notifications/stream`
- Server keeps it open + pushes event when new notifcation comes
- Inside server we keep a small map: `studentId -> response stream`
- When DB saves a new notifcation, service checks map and writes SSE event to that student stream