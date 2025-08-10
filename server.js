import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Serve static
const pubDir = path.join(__dirname, 'public');
app.use(express.static(pubDir));

// Health
app.get('/health', (_, res) => res.send('ok'));

// --- WebSocket relay ---
// Room = { clients: Set<ws>, started: boolean }
const rooms = new Map();

function roomKey(code) {
  return (code || '').toString().trim().toUpperCase();
}

function send(ws, type, data={}){
  try {
    ws.send(JSON.stringify({type, ...data}));
  } catch {}
}

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (buf) => {
    let msg;
    try { msg = JSON.parse(buf.toString()); } catch { return; }
    const { type } = msg || {};

    if (type === 'join') {
      const code = roomKey(msg.code);
      if (!code) return send(ws, 'error', {message:'Invalid code'});
      let room = rooms.get(code);
      if (!room) {
        room = { clients: new Set(), started: false };
        rooms.set(code, room);
      }
      if (room.clients.size >= 2) {
        return send(ws, 'full', {message:'Room is full'});
      }
      currentRoom = code;
      room.clients.add(ws);
      send(ws, 'joined', { players: room.clients.size });
      // Notify others
      room.clients.forEach(c => { if (c !== ws) send(c,'peer-joined',{}); });
      return;
    }

    if (!currentRoom) return;

    // Relay gameplay messages to the other peer in the same room
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.clients.forEach((c) => {
      if (c !== ws) {
        send(c, type, msg);
      }
    });

    // Clean up when both clients left
  });

  ws.on('close', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.clients.delete(ws);
    // Tell remaining peer that opponent left
    room.clients.forEach(c => send(c, 'peer-left', {}));
    if (room.clients.size === 0) {
      rooms.delete(currentRoom);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('ASTROVO multiplayer server running on http://localhost:'+PORT);
});
