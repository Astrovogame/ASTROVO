# ASTROVO

## Lokale installatie
```bash
npm install
npm start
```
Open daarna in je browser: `http://localhost:3000`

## Deploy op Render (gratis tier)

1. Zet je code op GitHub
```bash
echo "# ASTROVO" >> README.md
rm -rf .git            # alleen als er al een .git map bestaat
git init
git add .
git commit -m "Eerste upload van ASTROVO-PvP"
git branch -M main
git remote add origin https://github.com/Astrovogame/ASTROVO.git
git push -u origin main
```

2. Maak een Web Service op Render
- Ga naar render.com → Log in → **New +** → **Web Service**.
- Kies **Build from a Git repo** → selecteer `Astrovogame/ASTROVO`.
- **Environment:** Node  
- **Build Command:** `npm install`  
- **Start Command:** `npm start`

3. Wacht tot de build klaar is
Je krijgt een URL zoals `https://jouw-appnaam.onrender.com`.

## Multiplayer spelen
- Open dezelfde URL in 2 tabbladen of stuur de link naar iemand anders.
- Vul dezelfde roomcode in.

## Tips
- Auto-deploy aanzetten in Render voor automatische updates.
- Logs bekijken in Render-dashboard bij problemen.
