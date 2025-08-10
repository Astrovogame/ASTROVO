# ASTROVO — Singleplayer + Multiplayer (GitHub & Replit ready)

## Run locally
```bash
npm install
npm start
# open http://localhost:3000
# multiplayer: /multiplayer.html
```

## Replit
- Import from GitHub → Run (npm start).
- Singleplayer: `/` or `/index.html`
- Multiplayer: `/multiplayer.html` (WS uses same origin).


## 1v1 Multiplayer – Visual Parity with Singleplayer

- Multiplayer now uses the same **UFO**, **glowing ring**, **starfield background**, **coins on the ring**, and **obstacle wedges** as singleplayer.
- The 1v1 flow is still: **Create/Join room → Ready → Countdown → Play**.
- Seeded spawns ensure both players get identical obstacle/coin patterns. We only sync **score** and **death** events, so you don't need super low latency.
- To run locally:
  ```bash
  npm install
  node server.js
  # open http://localhost:3000/multiplayer.html in two browser windows
  ```
