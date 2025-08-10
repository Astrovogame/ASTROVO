
// Multiplayer client for ASTROVO using Socket.IO
(function () {
  // Seeded RNG (Mulberry32) and override helper
  function mulberry32(a){ return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
  let restoreRandom = null;
  function useSeededRandom(seed){
    const seeded = mulberry32(seed >>> 0);
    const old = Math.random;
    Math.random = seeded;
    restoreRandom = () => { Math.random = old; restoreRandom = null; };
  }

  const mpBtn   = document.getElementById('multiplayerBtn');
  const mpOv    = document.getElementById('mpOverlay');
  const mpName  = document.getElementById('mpName');
  const mpQuick = document.getElementById('mpQuick');
  const mpClose = document.getElementById('mpClose');
  const mpStatus= document.getElementById('mpStatus');

  // Overlay canvas for opponent
  const mpCanvas = document.getElementById('mpCanvas');
  const mpCtx = mpCanvas.getContext('2d');

  // Match state
  let ioSocket = null;
  let inRoom = false;
  let opponent = { angle: null, alive: false, name: 'Rood' };

  // Safe access to game globals (declared by the main game script)
  const hasGame = () => typeof window.playerAngle !== 'undefined';

  // Resize overlay canvas to match main canvas size
  function resizeMpCanvas() {
    mpCanvas.width  = window.innerWidth;
    mpCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeMpCanvas);
  resizeMpCanvas();

  function show(el){ el.style.display = 'flex'; }
  function hide(el){ el.style.display = 'none'; }

  if (mpBtn) {
    mpBtn.addEventListener('click', () => show(mpOv));
  }
  if (mpClose) {
    mpClose.addEventListener('click', () => hide(mpOv));
  }

  // Draw the opponent as a red UFO on its angle
  function drawOpponent() {
    if (!hasGame()) return;
    mpCtx.clearRect(0, 0, mpCanvas.width, mpCanvas.height);
    if (opponent.angle == null) return;

    // The game exposes cx, cy, radius for the ring
    if (typeof window.cx === 'undefined' || typeof window.cy === 'undefined' || typeof window.radius === 'undefined') return;

    const cx = window.cx, cy = window.cy, radius = window.radius;
    const pr = 22; // same scale as player
    const x = cx + radius * Math.cos(opponent.angle);
    const y = cy + radius * Math.sin(opponent.angle);

    mpCtx.save();
    mpCtx.translate(x, y);

    // Base (ellipse)
    mpCtx.beginPath();
    mpCtx.ellipse(0, pr * 0.25, pr * 1.2, pr * 0.9, 0, 0, Math.PI * 2);
    mpCtx.fillStyle = '#d32f2f'; // red base
    mpCtx.fill();

    // Dome
    mpCtx.beginPath();
    mpCtx.arc(0, -pr * 0.1, pr * 0.8, Math.PI, 0);
    mpCtx.fillStyle = '#ffebee';
    mpCtx.fill();

    // Name tag (if available)
    if (opponent.name) {
      mpCtx.font = '14px Montserrat, sans-serif';
      mpCtx.textAlign = 'center';
      mpCtx.fillStyle = 'white';
      mpCtx.fillText(opponent.name, 0, -pr * 1.3);
    }
    mpCtx.restore();
  }

  // render loop for overlay
  function loop() {
    drawOpponent();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Connect and quick match
  mpQuick?.addEventListener('click', () => {
    if (ioSocket) return;
    mpStatus.textContent = 'Verbinden...';
    ioSocket = io();
    const name = (mpName?.value || '').trim();
    ioSocket.emit('queue:join', { name });

    ioSocket.on('queue:match', (data) => {
      inRoom = true;
      opponent.name = data.peerName || 'Rood';

      // Prepare deterministic start
      const seed = data.seed >>> 0;
      const startAt = data.startAt || (Date.now() + 2000);
      useSeededRandom(seed);

      const ms = Math.max(0, startAt - Date.now());
      mpStatus.textContent = `Match gevonden! Start in ${(ms/1000).toFixed(1)}s...`;

      // Wait until synchronized start, then press Start
      setTimeout(() => {
        const startBtn = document.getElementById('startBtn');
        // Safety: if already running, do nothing
        if (typeof window.running === 'boolean' && window.running) return;
        // Ensure RNG is still seeded before the game creates objects
        useSeededRandom(seed);
        startBtn?.click();
        hide(mpOv);
      }, ms);
    });

    ioSocket.on('peer:state', (st) => {
      opponent.angle = st.angle;
      opponent.alive = st.alive;
    });

    ioSocket.on('disconnect', () => {
      inRoom = false;
      ioSocket = null;
      opponent.angle = null;
      mpStatus.textContent = 'Verbinding verbroken.';
    });
  });

  // Periodically send our own state
  setInterval(() => {
    if (!ioSocket || !inRoom || !hasGame()) return;
    ioSocket.emit('me:state', {
      angle: window.playerAngle || 0,
      alive: !!window.running && !window.gameOver,
    });
  }, 60); // ~16 FPS is plenty for angles

})();
