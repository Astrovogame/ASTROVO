# ASTROVO — Circle Runner (Single & Multiplayer)

This is a GitHub/Replit-ready version of your game with **1v1 online multiplayer** using PeerJS.
It serves the app via a tiny **Node.js + Express** server so that service workers and WebRTC run smoothly on Replit.

## Run on Replit
1. Create a new **Node.js** Replit.
2. Upload this whole folder (or import from GitHub).
3. Replit will install dependencies automatically. If not, run:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm start
   ```
5. Open the web view. You should see the start screen with **Single Player** and **Multiplayer**.

> Multiplayer uses the public PeerJS cloud server by default. For heavy use, consider self-hosting a PeerJS server and swapping the Peer config in `index.html` (search for `new Peer(`).

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000` in your browser.

## Project structure
```
astrovo-github/
├─ public/
│  ├─ index.html
│  ├─ circle_runner.html
│  ├─ service-worker.js
│  ├─ manifest_circle.json
│  ├─ icon-192.png
│  └─ icon-512.png
├─ server.js
├─ package.json
├─ .gitignore
└─ README.md
```

## Notes
- Service worker and manifest are served from the root scope so PWA features work.
- Obstacles/coins/power-ups in **Multiplayer** are spawned by the **host** and broadcast to the peer, ensuring both players see the **exact same game**.
- If Replit’s network blocks WebRTC in your region, try opening the app in a separate browser tab or use a VPN. Alternatively, switch to a dedicated PeerJS server.
