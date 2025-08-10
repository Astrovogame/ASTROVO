// server.js — Static hosting + WebSocket server for ASTROVO (1v1)
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.send('ok'));

const server = app.listen(PORT, () => {
  console.log(`HTTP listening on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
console.log('WebSocket server attached (same port).');

/** Rooms: Map<roomCode, { players: Map<id,{id,name,ready,score,alive,ws}>, seed:number, startAt:number }> */
const rooms = new Map();

function getRoom(code){
  if(!rooms.has(code)){
    rooms.set(code, { players:new Map(), seed: 0, startAt: 0 });
  }
  return rooms.get(code);
}

function broadcastRoom(code, msg){
  const r = rooms.get(code);
  if(!r) return;
  for(const p of r.players.values()){
    try{ p.ws.send(JSON.stringify(msg)); }catch{}
  }
}

function roomState(code){
  const r = rooms.get(code);
  if(!r) return { type:'roomState', room:code, players:[] };
  const players = Array.from(r.players.values()).map(p=> ({
    id: p.id, name: p.name, ready: !!p.ready, score: p.score||0, alive: p.alive!==false
  }));
  return { type:'roomState', room:code, players };
}

function tryStart(code){
  const r = rooms.get(code);
  if(!r) return;
  const ps = Array.from(r.players.values());
  if(ps.length === 2 && ps.every(p=>p.ready)){
    // start a round
    r.seed = Math.floor(Math.random()*0xFFFFFFFF)>>>0;
    // give clients a small delay to align start times
    r.startAt = Date.now() + 1800;
    // reset per-player fields
    for(const p of ps){ p.score = 0; p.alive = true; }
    broadcastRoom(code, { type:'start', t:3, seed: r.seed, startAt: r.startAt });
  }
}

wss.on('connection', (ws)=>{
  const id = uuidv4();
  let currentRoom = null;
  ws.send(JSON.stringify({ type:'hello', id }));

  ws.on('message', data => {
    let msg={}; try{ msg = JSON.parse(data); }catch{}

    if(msg.type === 'create' || msg.type === 'join'){
      currentRoom = (msg.room||'').toString().slice(0,32);
      if(!currentRoom) return;
      const r = getRoom(currentRoom);
      r.players.set(id, { id, name: msg.name||'Player', ready:false, score:0, alive:true, ws });
      broadcastRoom(currentRoom, roomState(currentRoom));
      return;
    }

    if(msg.type === 'leave'){
      if(currentRoom && rooms.has(currentRoom)){
        const r = rooms.get(currentRoom);
        r.players.delete(id);
        broadcastRoom(currentRoom, roomState(currentRoom));
        if(r.players.size === 0){ rooms.delete(currentRoom); }
      }
      currentRoom = null;
      return;
    }

    if(msg.type === 'ready'){
      if(!currentRoom) return;
      const r = rooms.get(currentRoom); if(!r) return;
      const p = r.players.get(id); if(!p) return;
      p.ready = !p.ready;
      broadcastRoom(currentRoom, roomState(currentRoom));
      tryStart(currentRoom);
      return;
    }

    if(msg.type === 'rematch'){
      if(!currentRoom) return;
      // unready everyone; client UI will show lobby, and once both ready we start again
      const r = rooms.get(currentRoom); if(!r) return;
      for(const p of r.players.values()){ p.ready=false; p.score=0; p.alive=true; }
      broadcastRoom(currentRoom, { type:'broadcast', data:{ kind:'rematchAck' } });
      broadcastRoom(currentRoom, roomState(currentRoom));
      return;
    }

    // Relay arbitrary messages from one client to the whole room
    if((msg.type === 'signal' || msg.type === 'broadcast') && currentRoom){
      broadcastRoom(currentRoom, { type:'broadcast', data: msg.data });
      return;
    }
  });

  ws.on('close', ()=>{
    if(currentRoom && rooms.has(currentRoom)){
      const r = rooms.get(currentRoom);
      r.players.delete(id);
      broadcastRoom(currentRoom, roomState(currentRoom));
      if(r.players.size === 0){ rooms.delete(currentRoom); }
    }
  });
});
