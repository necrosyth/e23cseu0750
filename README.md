# Notification System Assignment

Simple full-stack notification project with:
- reusable logging middleware
- backend proxy API
- frontend pages for all notifications and priority inbox

## Run
- Logging middleware: `cd logging_middleware && npm install`
- Backend: `cd notification_app_be && npm install && npm run dev`
- Frontend: `cd notification_app_fe && npm install && npm run dev`

Ports:
- backend: `4000`
- frontend: `3000`

## Env Vars

### `logging_middleware/.env`
- `BASE_URL` : evaluation service base URL
- `EMAIL` : account email
- `NAME` : your name
- `ROLL_NO` : roll number
- `ACCESS_CODE` : access code
- `CLIENT_ID` : issued client id
- `CLIENT_SECRET` : issued client secret

### `notification_app_be/.env`
- `PORT` : backend port (default 4000)
- `ALLOWED_ORIGIN` : allowed frontend origin (default http://localhost:3000)
- `BASE_URL` : evaluation service base URL
- `EMAIL` : account email
- `NAME` : your name
- `ROLL_NO` : roll number
- `ACCESS_CODE` : access code
- `CLIENT_ID` : issued client id
- `CLIENT_SECRET` : issued client secret

### `notification_app_fe/.env.local`
- `NEXT_PUBLIC_API_URL` : backend URL, usually `http://localhost:4000`
