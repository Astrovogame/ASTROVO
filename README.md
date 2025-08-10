# ASTROVO — Single & Multiplayer (GitHub + Replit ready)

Deze repo is klaar voor **beide** workflows:

- **GitHub Pages / Replit (HTML/CSS/JS):** gebruik de bestanden in de **root** (statische site, geen npm nodig).
- **Replit (Node.js):** gebruik de map **/node** (Express server, npm scripts).

## Multiplayer
- Startscherm heeft **Single Player** en **Multiplayer**.
- Multiplayer overlay: **Your name** + **Room code** → **Create Room** (host) of **Join Room** (gast). Host klikt **Start 1v1**.
- **Host-authoritative spawns:** obstakels/coins/power-ups identiek voor beide spelers.
- **Tegenstander zichtbaar** als rode UFO.

---

## Optie 1 — GitHub Pages (statisch, geen npm)
1. Push deze repo naar GitHub.
2. Settings → Pages → **Deploy from branch** → `main` → **root**.
3. Open je Pages-URL.  
   > Zie je oude code? Hard refresh of Service Worker **Unregister** (Chrome → DevTools → Application → Service Workers).

## Optie 2 — Replit (HTML/CSS/JS, geen npm)
1. Maak een **HTML/CSS/JS** Repl.
2. Upload **alle bestanden uit de root** (zoals `index.html`, `service-worker.js`, etc.).
3. Klik **Run**. Multiplayer werkt via **PeerJS cloud**.

## Optie 3 — Replit (Node.js, met npm) — map /node
1. Maak een **Node.js** Repl.
2. Upload de inhoud van de map **/node** in de root van die Repl.
3. Voer uit:
   ```bash
   npm install
   npm start
   ```
   of klik **Run** (door `.replit`).

Veel speelplezier!
