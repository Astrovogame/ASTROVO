ASTROVO – 1v1 PvP (Socket.IO)
=================================

Installatie
-----------
1) Zorg dat je Node.js 18+ hebt.
2) Open een terminal in deze map en voer uit:

   npm install
   npm start

3) Open daarna je browser op: http://localhost:3000

Spelen
------
- In het hoofdmenu kies je Singleplayer of Multiplayer (1v1).
- In multiplayer vul je een room code en je naam in. Deel dezelfde room code met je tegenstander.
- Zodra 2 spelers in de room zitten, start de ronde automatisch.
- De server spawnt obstakels, coins en power-ups. Beide spelers zien exact dezelfde items.
- Bots je (zonder shield) tegen een obstakel, dan verlies je de ronde.

Structuur
---------
- server.js        -> Node.js server met Socket.IO, regelt rooms en spawns
- /public/index.html -> De game (client) met zowel singleplayer als 1v1 multiplayer
- /public/manifest_circle.json, icons -> PWA assets (optioneel)
