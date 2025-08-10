
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(__dirname + '/public'));

// 1v1 rooms with simple server-driven spawns
const MAX_PLAYERS = 2;
const COIN_LIFE = 4000;
const POWERUP_LIFE = 4000;

const rooms = {}; // roomId -> { players: {socketId: {name,color,angle,score}}, spawner, items: [], started:false }

function randomAngle() {
  return Math.random() * Math.PI * 2;
}

function broadcastPlayers(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  io.to(roomId).emit('players', room.players);
}

function startRoom(roomId) {
  const room = rooms[roomId];
  if (!room || room.started) return;
  room.started = true;
  room.items = [];
  // regular spawn timers
  room.spawner = {
    obst: setInterval(() => {
      const item = { id: 'ob-' + Date.now() + '-' + Math.floor(Math.random()*9999), type: 'obstacle', angle: randomAngle(), t: Date.now() };
      room.items.push(item);
      io.to(roomId).emit('spawn', item);
    }, 1500),
    coin: setInterval(() => {
      const item = { id: 'co-' + Date.now() + '-' + Math.floor(Math.random()*9999), type: 'coin', angle: randomAngle(), t: Date.now(), life: COIN_LIFE };
      room.items.push(item);
      io.to(roomId).emit('spawn', item);
      setTimeout(() => {
        // expire coin if not collected
        const idx = room.items.findIndex(it => it.id === item.id);
        if (idx !== -1) {
          room.items.splice(idx, 1);
          io.to(roomId).emit('despawn', { id: item.id });
        }
      }, COIN_LIFE + 50);
    }, 3000),
    power: setInterval(() => {
      const ptype = Math.random() < 0.5 ? 'shield' : 'slow';
      const item = { id: 'pu-' + Date.now() + '-' + Math.floor(Math.random()*9999), type: 'powerup', ptype, angle: randomAngle(), t: Date.now(), life: POWERUP_LIFE };
      room.items.push(item);
      io.to(roomId).emit('spawn', item);
      setTimeout(() => {
        const idx = room.items.findIndex(it => it.id === item.id);
        if (idx !== -1) {
          room.items.splice(idx, 1);
          io.to(roomId).emit('despawn', { id: item.id });
        }
      }, POWERUP_LIFE + 50);
    }, 12000)
  };
  io.to(roomId).emit('start', { t: Date.now() + 500 }); // give clients 0.5s to prep
}

function stopRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  if (room.spawner) {
    Object.values(room.spawner).forEach(clearInterval);
  }
  room.started = false;
}

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join', ({ roomId, name, skin }) => {
    if (!roomId || typeof roomId !== 'string') return;
    if (!rooms[roomId]) rooms[roomId] = { players: {}, items: [], started: false, spawner: null };

    const room = rooms[roomId];
    const numPlayers = Object.keys(room.players).length;
    if (numPlayers >= MAX_PLAYERS) {
      socket.emit('room_full');
      return;
    }

    currentRoom = roomId;
    socket.join(roomId);

    // assign a color
    const palette = ['#29b6f6', '#e53935', '#8e24aa', '#43a047', '#fdd835', '#ff5722'];
    const used = new Set(Object.values(room.players).map(p => p.color));
    const color = palette.find(c => !used.has(c)) || palette[(numPlayers) % palette.length];

    room.players[socket.id] = { name: name || 'Player', color, skin: skin || 'default', angle: 0, score: 0 };
    socket.emit('joined', { ok: true, color });

    broadcastPlayers(roomId);

    // if two players, (re)start the room
    if (Object.keys(room.players).length === MAX_PLAYERS) {
      stopRoom(roomId);
      startRoom(roomId);
    }
  });

  socket.on('state', ({ angle, score }) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room || !room.players[socket.id]) return;
    room.players[socket.id].angle = angle || 0;
    room.players[socket.id].score = score || 0;
    // Throttle broadcast by clients rendering; we can emit to room every state event (small rooms)
    io.to(currentRoom).emit('players', room.players);
  });

  socket.on('collect', ({ id, kind }) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;
    const idx = room.items.findIndex(it => it.id === id);
    if (idx !== -1) {
      room.items.splice(idx, 1);
      io.to(currentRoom).emit('despawn', { id });
      // Optionally tally on server
    }
  });

  socket.on('hit', () => {
    // A player lost -> end round, announce winner if any
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;
    const players = Object.keys(room.players);
    const loser = socket.id;
    const winner = players.find(id => id !== loser);
    io.to(currentRoom).emit('round_over', {
      winner: winner ? room.players[winner] : null,
      loser: room.players[loser] || null
    });
    // Reset room state but keep players; restart after short delay if still 2
    stopRoom(currentRoom);
    room.items = [];
    setTimeout(() => {
      if (Object.keys(room.players).length === MAX_PLAYERS) {
        startRoom(currentRoom);
      } else {
        io.to(currentRoom).emit('waiting');
      }
    }, 1500);
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;
    delete room.players[socket.id];
    stopRoom(currentRoom);
    io.to(currentRoom).emit('players', room.players);
    io.to(currentRoom).emit('waiting');
    // cleanup empty rooms
    if (Object.keys(room.players).length === 0) {
      delete rooms[currentRoom];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("ASTROVO PvP server on http://localhost:" + PORT);
});
