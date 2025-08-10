
# ASTROVO – Multiplayer (Socket.IO)

Live zien waar je tegenstander op de ring staat (rood), zonder de kern van het spel te wijzigen.
Dit project is **GitHub- en Replit‑ready**.

## Starten (lokaal of in Replit)

```bash
npm install
npm start
```
Open daarna `http://localhost:3000`. Start de **Multiplayer** via de knop op het startscherm en kies **Snel meedoen** op beide clients.

## Hoe het werkt
- Kleine Node/Express server + Socket.IO.
- Clients sturen elke 60 ms hun `angle`/`alive` naar de server.
- De server paart spelers 2‑aan‑2 en relayed de status naar de peer.
- De client tekent de tegenstander op een overlay‑canvas (`#mpCanvas`) in **rood**.
- Geen gameplay is gewijzigd: botsingen/obstakels blijven lokaal.

## Bestanden
- `server.js` – Socket.IO matchmaker + static hosting.
- `public/index.html`, `public/circle_runner.html` – krijgen een Multiplayer‑knop, overlay UI en scripts.
- `public/multiplayer.js` – client code.
- `public/*` – bestaande assets (manifest, icons, service worker).

## Optioneel (ideeën)
- Kamercodes i.p.v. automatisch paren.
- Scores syncen aan het eind en een winnaar tonen.
- "Same seed" modus zodat obstakels identiek zijn bij beide spelers.


## Synchronisatie van objecten
Bij een match deelt de server een **seed** en **startAt** (tijdstempel). De client:
- zet een **seeded RNG** (Mulberry32) door `Math.random` tijdelijk te overschrijven;
- **start exact tegelijk** op `startAt`;
- zo ontstaan alle obstakels/coins identiek bij beide spelers, zonder de core game aan te passen.
Na Game Over wordt `Math.random` weer hersteld.


## Speel via code
- Klik **Multiplayer** → **Maak kamer** → deel de 4-teken code (bijv. `7K3F`).
- De ander vult de code in en klikt **Join**.
- Zodra de tweede speler joint, krijgt iedereen seed + starttijd en start de match synchroon.
