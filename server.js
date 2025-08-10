
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
let waiting = null; // queue mode
const rooms = new Map(); // code -> { code, members: [socketId], names: {socketId:name}, ready: {socketId:bool} }

function makeCode(){ const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=chars[Math.floor(Math.random()*chars.length)]; return s; }

io.on('connection', (socket) => {
  let roomId = null;
  let name = null;

  // Queue mode (kept for backwards compatibility)
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

  // Room code system
  socket.on('room:create', (data={}) => {
    const name = (data.name||'').slice(0,24);
    let code;
    do { code = makeCode(); } while (rooms.has(code));
    rooms.set(code, { code, members:[socket.id], names: { [socket.id]: name }, ready: { [socket.id]: false } });
    socket.join(code);
    socket.emit('room:created', { code });
    io.to(code).emit('room:state', { code, members: rooms.get(code).members, names: rooms.get(code).names, ready: rooms.get(code).ready });
  });

  socket.on('room:join', (data={}) => {
    const code = (data.code||'').toUpperCase();
    const name = (data.name||'').slice(0,24);
    const room = rooms.get(code);
    if (!room) { socket.emit('room:error', 'Kamer niet gevonden'); return; }
    if (room.members.length >= 2) { socket.emit('room:error', 'Kamer is vol'); return; }
    room.members.push(socket.id);
    room.names[socket.id] = name;
    room.ready[socket.id] = false;
    socket.join(code);
    // broadcast waiting room state
    io.to(code).emit('room:state', { code, members: room.members, names: room.names, ready: room.ready });
  });


  socket.on('room:ready', () => {
    const room = [...rooms.values()].find(r => r.members.includes(socket.id));
    if (!room) return;
    room.ready[socket.id] = true;
    io.to(room.code).emit('room:state', { code: room.code, members: room.members, names: room.names, ready: room.ready });

    if (room.members.length === 2 && room.ready[room.members[0]] && room.ready[room.members[1]]) {
      // Both are ready: start!
      const startAt = Date.now() + 3000;
      const seed = Math.floor(Math.random()*1e9);
      const [a,b] = room.members;
      io.to(a).emit('queue:match', { roomId: room.code, peerName: room.names[b], startAt, seed });
      io.to(b).emit('queue:match', { roomId: room.code, peerName: room.names[a], startAt, seed });
      // Reset readiness for potential rematch later (optional)
      room.ready[a] = false;
      room.ready[b] = false;
    }
  });

  socket.on('room:leave', () => {
    for (const [code, room] of rooms) {
      const idx = room.members.indexOf(socket.id);
      if (idx !== -1) {
        room.members.splice(idx,1);
        delete room.names[socket.id];
        delete room.ready[socket.id];
        socket.leave(code);
        if (room.members.length === 0) {
          rooms.delete(code);
        } else {
          io.to(code).emit('room:state', { code, members: room.members, names: room.names, ready: room.ready });
        }
        break;
      }
    }
  });

  // Relay state to the other peer in the room
  socket.on('me:state', (state) => {
    if (!roomId) return;
    socket.to(roomId).emit('peer:state', state);
  });

  socket.on('disconnect', () => {
    // Remove from room if present
    for (const [code, room] of rooms) {
      const idx = room.members.indexOf(socket.id);
      if (idx !== -1) {
        room.members.splice(idx,1);
        delete room.names[socket.id];
        delete room.ready[socket.id];
        if (room.members.length === 0) rooms.delete(code);
        else io.to(code).emit('room:state', { code, members: room.members, names: room.names, ready: room.ready });
        break;
      }
    }
    if (waiting && waiting.socketId === socket.id) {
      waiting = null;
    }
  });
});

http.listen(PORT, () => console.log(`ASTROVO multiplayer server on http://localhost:${PORT}`));
