// server.js — Static hosting + WebSocket server for ASTROVO
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

// ---- simple room model ----
const rooms = new Map(); // roomName -> {players: Map(id,{id,name,ready,score,alive,ws}), seed: number, startAt: number}

function getRoom(name){
  if(!rooms.has(name)){
    rooms.set(name, { players:new Map(), seed: Math.floor(Math.random()*1e9)>>>0, startAt: 0 });
  }
  return rooms.get(name);
}

function roomState(name){
  const r = rooms.get(name);
  if(!r) return { type:'roomState', room: name, players: [] };
  return {
    type: 'roomState',
    room: name,
    players: Array.from(r.players.values()).map(p=>({id:p.id, name:p.name, ready:p.ready, score:p.score, alive:p.alive})),
    seed: r.seed,
    startAt: r.startAt
  };
}

function broadcastRoom(name, msg){
  const r = rooms.get(name);
  if(!r) return;
  for(const p of r.players.values()){
    try{ p.ws.send(JSON.stringify(msg)); }catch{}
  }
}

wss.on('connection', (ws)=>{
  const id = uuidv4();
  let currentRoom = null;
  ws.send(JSON.stringify({type:'hello', id}));

  ws.on('message', (data)=>{
    let msg={}; try{ msg=JSON.parse(data); }catch{}
    // generic relays
    if((msg.type==='broadcast' || msg.type==='signal') && currentRoom){
      broadcastRoom(currentRoom, {type:'broadcast', data: msg.data});
      return;
    }
    if(msg.type==='create' || msg.type==='join'){
      currentRoom = msg.room;
      const r = getRoom(currentRoom);
      r.players.set(id, {id, name: msg.name||'Player', ready:false, score:0, alive:true, ws});
      broadcastRoom(currentRoom, roomState(currentRoom));
      return;
    }
    if(msg.type==='leave'){
      if(currentRoom && rooms.has(currentRoom)){
        const r = rooms.get(currentRoom);
        r.players.delete(id);
        broadcastRoom(currentRoom, roomState(currentRoom));
      }
      currentRoom = null;
      return;
    }
    if(msg.type==='ready'){
      if(!currentRoom) return;
      const r = rooms.get(currentRoom);
      const p = r?.players?.get(id);
      if(p){ p.ready = !p.ready; }
      broadcastRoom(currentRoom, roomState(currentRoom));
      // if both ready, start
      if(r && r.players.size===2 && Array.from(r.players.values()).every(pl=>pl.ready)){
        r.seed = Math.floor(Math.random()*1e9)>>>0;
        r.startAt = Date.now() + 1500; // 1.5s in the future for countdown
        broadcastRoom(currentRoom, { type:'start', seed: r.seed, startAt: r.startAt, t: 3 });
      }
      return;
    }
    if(msg.type==='rematch'){
      if(!currentRoom) return;
      broadcastRoom(currentRoom, {type:'broadcast', data:{kind:'rematchAck'}});
      return;
    }
  });

  ws.on('close', ()=>{
    if(currentRoom && rooms.has(currentRoom)){
      const r = rooms.get(currentRoom);
      r.players.delete(id);
      broadcastRoom(currentRoom, roomState(currentRoom));
    }
  });
});
