
const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
app.use(express.static(PUBLIC));

// Simple queue-based matcher: pair players 2-by-2 into ephemeral rooms
let waiting = null; // { socketId, name }

io.on('connection', (socket) => {
  let roomId = null;
  let name = null;

  socket.on('queue:join', (data = {}) => {
    name = (data.name || '').slice(0, 24);
    if (waiting && waiting.socketId !== socket.id) {
      // Pair with the waiting player
      roomId = `room_${waiting.socketId}_${socket.id}`;
      socket.join(roomId);
      io.sockets.sockets.get(waiting.socketId)?.join(roomId);

      // Notify both
      const startAt = Date.now() + 3000; // synchronized start in ~3s
      const seed = Math.floor(Math.random() * 1e9);
      socket.emit('queue:match', { roomId, peerName: waiting.name, startAt, seed });
      io.to(waiting.socketId).emit('queue:match', { roomId, peerName: name, startAt, seed });

      waiting = null;
    } else {
      waiting = { socketId: socket.id, name };
    }
  });

  // Relay state to the other peer in the room
  socket.on('me:state', (state) => {
    if (!roomId) return;
    socket.to(roomId).emit('peer:state', state);
  });

  socket.on('disconnect', () => {
    if (waiting && waiting.socketId === socket.id) {
      waiting = null;
    }
  });
});

http.listen(PORT, () => console.log(`ASTROVO multiplayer server on http://localhost:${PORT}`));
