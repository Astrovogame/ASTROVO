
# ASTROVO – 1v1 Multiplayer

Een 1-tegen-1 versie van je bestaande cirkelrunner. Je ziet elkaar op dezelfde ring; wie het langst overleeft wint. Multiplayer gebruikt een eenvoudige WebSocket relay-server (meegeleverd).

## Snel starten op Replit
1. Importeer deze repo/zip in Replit.
2. Replit installeert dependencies automatisch (`express`, `ws`).
3. Run met **`npm start`**. Je krijgt een web-URL (bijv. https://<project>.repl.co).
4. Open die URL in twee browsers/apparaten.
5. Klik **Multiplayer**, vul **naam + dezelfde kamercode**, join beide spelers.
6. De host start automatisch; je ziet elkaar (jij blauw, tegenstander rood).

## Lokale installatie
```bash
npm install
npm start
```
Open http://localhost:3000 in twee tabbladen en join met dezelfde kamercode.

## Bestanden
- `server.js` — Express + WebSocket relay (2 spelers per room).
- `public/index.html` — het spel + UI, inclusief 1v1‑logica.
- `public/manifest_circle.json` en icons — PWA manifest.

> Opmerking: de wereld (obstakels/coins/power‑ups) is **deterministisch** gesynchroniseerd via een gedeelde seed (afgeleid van de kamer‑code) en een gedeelde starttijd. Daardoor is het spel identiek bij beide spelers zonder zware netwerk‑sync.
