# XOXO - Fullstack Nakama Project

**XOXO** is a cross-platform fullstack project integrating **Nakama** with **React Native** mobile app and **React Web** frontend. Deployed on a **Google Cloud VM**.

---

## Features

- Real-time multiplayer with Nakama
- React Native mobile app (iOS/Android)
- React web app
- User authentication & game state sync
- Web hosted via `npx serve` on VM
- Google Cloud firewall-configured ports

---

## Tech Stack

- **Backend:** Nakama server (Go)  
- **Mobile App:** React Native (Expo)  
- **Web App:** React (`npx serve`)  
- **Database:** PostgreSQL (Nakama)  
- **Deployment:** Google Cloud VM  

---

## Setup

### Nakama Server

```bash
docker run --name nakama -p 7350:7350 -p 7351:7351 heroiclabs/nakama
```
Make sure ports 7350 and 7351 are open in Google Cloud firewall.

### Web App

```bash
cd client
npm install
npm run web:build       # Build web
npm run web:serve       # Serve on 0.0.0.0:3000
```
Open port 3000 in VM firewall to access externally:
`http://<VM_PUBLIC_IP>:3000`

### Mobile App

```bash
cd client
npm install
npm run android   # Android device/emulator
npm run ios       # iOS device/simulator
```
Configure Nakama host in app (`extra.nakamaHost` or similar) with VM public IP

---

## Project Structure

```
.
├── server/        # Nakama Go server & scripts
├── client/               # React Native / Web app
│   ├── App.js
│   ├── package.json
│   └── app.json          # Expo config
└── README.md
```

---

## Environment

- Nakama host: VM public IP
- Nakama ports: 7350 (HTTP), 7351 (gRPC)
- App extra config from <mcfile name="app.json" path="c:\Users\Anonymous_\Desktop\lila-tictactoe\client\app.json"></mcfile> (`expo.extra.eas.projectId`)

---

## Scripts

- `npm run start` → Start Expo dev server
- `npm run web` → Start web dev
- `npm run web:build` → Build web app
- `npm run web:serve` → Serve built web app on port 3000
- `npm run android` / `npm run ios` → Run mobile app

---

## License

MIT License

---

## Deployment

Frontend Deployed Link: [http://34.131.145.246:3000](http://34.131.145.246:3000)
Android App Link: [https://expo.dev/artifacts/eas/4ZKStZqK2dKQGTuLm3i9Yg.apk](https://expo.dev/artifacts/eas/4ZKStZqK2dKQGTuLm3i9Yg.apk)






