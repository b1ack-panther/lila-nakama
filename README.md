# Lila Tic-Tac-Toe

This repository contains a minimal production-ready scaffold for a multiplayer Tic-Tac-Toe game using **Nakama** (with Go runtime plugins) as backend and **React Native** with NativeWind as frontend.

## Features
- Device-based authentication (JWT, 1 hour expiry)
- Server-authoritative match logic implemented in Go runtime plugin
- Real-time gameplay via Nakama WebSocket
- Simple matchmaking (single mode)
- Leaderboard (mock/demo RPC; replace with real leaderboard writes)
- Dockerized backend + Postgres, Docker Compose for local dev
- Sample Google Cloud deployment notes in `DEPLOYMENT.md`

## Quickstart (local)

1. Copy `.env.sample` to `.env` and edit if needed.

2. Start backend (Nakama + Postgres):
```bash
docker-compose up --build
```

Nakama admin console: http://localhost:7351

3. Start frontend (React Native):
```bash
cd frontend
npm install
npx react-native start
# then run on device/emulator:
npx react-native run-android
```

## Folder structure
See the top-level directory tree — backend Go runtime and frontend React Native app.

## Environment (.env.sample)
```
POSTGRES_PASSWORD=examplepassword
NAKAMA_SERVER_KEY=defaultkey
NAKAMA_HOST=127.0.0.1
NAKAMA_PORT=7350
```

## Deployment (GCP)
See `DEPLOYMENT.md` for step-by-step instructions to deploy Nakama to Google Cloud Run with Cloud SQL.

## Notes
- This scaffold contains minimal error handling for brevity; expand for production use.
- Leaderboard RPC returns mock data; swap with actual Nakama leaderboard writes (`nk.LeaderboardRecordWrite`) for production.
