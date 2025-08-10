# ASTROVO — Single & Multiplayer (Static, GitHub‑ready)

Dit is een **statische** (geen Node/npm nodig) versie die je zo naar **GitHub** kunt pushen en ook in **Replit (HTML/CSS/JS)** kunt draaien.
Multiplayer werkt via de publieke **PeerJS cloud** (geen server nodig).

## Bestanden
- `index.html` — startscherm met **Single Player** + **Multiplayer**
- `circle_runner.html` — zelfde game-logic
- `service-worker.js`, `manifest_circle.json` — PWA-assets
- `icon-192.png`, `icon-512.png`
- `.nojekyll` — zodat GitHub Pages alles goed serveert

## Multiplayer (1v1)
- **Host** klikt in het startscherm op **Multiplayer** → kiest **Room code** → **Create Room** → na verbinding **Start 1v1**.
- **Gast** klikt **Multiplayer** → voert **Room code** in → **Join Room**.
- Alle **obstakels/coins/power-ups** worden **door de host ge-spawned en gebroadcast**, dus beide spelers zien exact hetzelfde.
- Je ziet de **tegenstander** als **rode UFO**.

## Replit (HTML/CSS/JS template)
1. Maak een nieuwe **HTML/CSS/JS** Repl.
2. Upload alle bestanden uit deze repo in de root (zorg dat `index.html` zichtbaar is, niet in een submap).
3. Klik **Run** om de preview te zien.
4. Zie je oude code? Doe een **hard refresh** (Ctrl+F5 / Cmd+Shift+R) of unregister de service worker
   (Chrome: DevTools → Application → Service Workers → **Unregister**).

## GitHub Pages
1. Nieuwe repository aanmaken op GitHub.
2. **Alle** bestanden uit deze map uploaden in de **root** (dus `index.html` staat op de root van je repo).
3. Ga naar **Settings → Pages** en kies **Deploy from branch**, branch `main`, folder `/ (root)`.
4. Wacht even; je site komt online. Open `https://<jouw-username>.github.io/<repo>`.

> Tip: test multiplayer in twee tabbladen/browsers (of twee devices). Gebruik dezelfde **Room code**.

