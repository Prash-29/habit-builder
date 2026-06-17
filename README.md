# Habit Tracker

A simple gym habit tracker — log your daily workout (type, time spent, notes) and see a 7-day overview.

**Live:** https://habit-builder-qglw.onrender.com/

> Hosted on Render's free tier — the first request after idle may take ~50s to wake (cold start).

## Stack

- **Next.js 16** (App Router) + React 19, TypeScript
- **MongoDB** via Mongoose (MongoDB Atlas in production)
- **Ant Design** + Tailwind CSS
- **Docker** (multi-stage, standalone output)

## Features

- Register with email (phone optional)
- Log one gym entry per day — workout type, minutes, description, notes
- Saving a log marks the day as "went" (one log per day, re-saving updates it)
- Weekly grid with per-day hover details + stats (gym days, total/avg minutes)

## Local development

```bash
npm install
npm run dev
```
App → http://localhost:3000

### Environment variables (`.env.local`)

```
MONGODB_URI=mongodb://localhost:27017/nextjs-mongo
# Optional — welcome email via Resend HTTP API (SMTP is blocked on most free hosts)
RESEND_API_KEY=
RESEND_FROM=Habit Tracker <onboarding@resend.dev>
```

## Run with Docker

```bash
docker compose up --build
```
Starts the app + a MongoDB container. App → http://localhost:3000

## Deploy (Render + Atlas)

- DB: MongoDB Atlas free (M0) cluster → set `MONGODB_URI`
- App: Render Web Service (Docker), branch `main`, instance type Free
- Set env vars in the Render dashboard (`MONGODB_URI`, optional `RESEND_API_KEY`)
- Auto-deploys on push to `main`

## API

- `GET /api/users` — list users; `?email=` / `?phone=` — find one
- `POST /api/users` — register
- `GET /api/logs?userId=&date=` — a day's log
- `PATCH /api/logs` — upsert today's log
- `GET /api/logs/week?userId=` — last 7 days
