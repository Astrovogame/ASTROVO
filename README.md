# ASTROVO — Singleplayer + Multiplayer (GitHub & Replit ready)

Dit project bevat je bestaande singleplayer **ongewijzigd** in `public/` en een **losse** multiplayer-modus.
De server host de static files en een WebSocket-relay op dezelfde poort (ideaal voor Replit).

## Snel starten (lokaal)
```bash
npm install
npm start
# open http://localhost:3000
# multiplayer: open /multiplayer.html (zelfde URL)
```

## Replit
1. Klik **Import from GitHub** en selecteer deze repo.
2. Replit installeert dependencies en start met `npm start` (Zo niet: stel de Run command in op `npm start`).
3. Open de webview-URL:
   - Singleplayer: `/` of `/index.html`
   - Multiplayer: `/multiplayer.html`
   - De WS-URL wordt automatisch ingesteld op hetzelfde domein (wss://...).

## Projectstructuur
```
public/               # alle statische bestanden
  index.html          # singleplayer
  multiplayer.html    # multiplayer client
  circle_runner.html  # (optioneel) je andere pagina
  service-worker.js
  manifest_circle.json
  icon-192.png
  icon-512.png
  _headers
  netlify.toml
server.js             # Express + ws (rooms)
package.json
```

## Opmerkingen
- Multiplayer is een **score-race** (ieder speelt zijn eigen run; scores/status worden live gedeeld).
- Wil je later een persistente highscore of een volledig gedeelde simulatie? Laat het weten, dan breiden we uit.
