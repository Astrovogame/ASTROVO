// server.js — Static hosting + WebSocket server for ASTROVO
// Works on Replit, Render, Railway, local, etc.
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static site from /public
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (_req, res) => res.send('ok'));

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`HTTP listening on http://localhost:${PORT}`);
});

// Attach WebSocket server to same HTTP server (same origin works on Replit)
const wss = new WebSocketServer({ server });
console.log('WebSocket server attached (same port).');

// --- Minimal room relay (head-to-head) ---
const rooms = new Map(); // roomId -> { players: Map<id,{id,name,ready,score,alive,ws}> }
function getRoom(room){
  if(!rooms.has(room)) rooms.set(room, { players: new Map() });
  return rooms.get(room);
}
function broadcastRoom(roomId, payload){
  const r = rooms.get(roomId); if(!r) return;
  for(const p of r.players.values()){
    if(p.ws.readyState===1){ p.ws.send(JSON.stringify(payload)); }
  }
}
function roomState(roomId){
  const r = rooms.get(roomId); if(!r) return {players:[]};
  return {
    type:'roomState',
    players: Array.from(r.players.values()).map(p=>({id:p.id,name:p.name,ready:p.ready,score:p.score,alive:p.alive}))
  };
}

wss.on('connection', (ws)=>{
  const id = uuidv4();
  let currentRoom = null;
  ws.send(JSON.stringify({type:'hello', id}));

  ws.on('message', data=>{
    let msg={}; try{ msg=JSON.parse(data); }catch{}
    if(msg.type==='create'){
      currentRoom = msg.room;
      const r = getRoom(currentRoom);
      r.players.set(id, {id, name:msg.name||'Player', ready:false, score:0, alive:true, ws});
      broadcastRoom(currentRoom, roomState(currentRoom));
    }
    if(msg.type==='join'){
      currentRoom = msg.room;
      const r = getRoom(currentRoom);
      r.players.set(id, {id, name:msg.name||'Player', ready:false, score:0, alive:true, ws});
      broadcastRoom(currentRoom, roomState(currentRoom));
    }
    if(msg.type==='leave'){
      if(currentRoom && rooms.has(currentRoom)){
        rooms.get(currentRoom).players.delete(id);
        broadcastRoom(currentRoom, roomState(currentRoom));
      }
      currentRoom=null;
    }
    if(msg.type==='ready'){
      if(!currentRoom) return;
      const r = getRoom(currentRoom);
      const p = r.players.get(id); if(!p) return;
      p.ready = !!msg.ready;
      broadcastRoom(currentRoom, roomState(currentRoom));
      if(r.players.size===2){
        const allReady = Array.from(r.players.values()).every(a=>a.ready);
        if(allReady){
          broadcastRoom(currentRoom, {type:'start', t:3});
          for(const pl of r.players.values()){ pl.ready=false; pl.score=0; pl.alive=true; }
        }
      }
    }
    if(msg.type==='signal'){
      if(!currentRoom) return;
      const r = getRoom(currentRoom);
      const p = r.players.get(id); if(p){
        if(msg.data && msg.data.kind==='score') p.score = msg.data.score|0;
        if(msg.data && msg.data.kind==='dead') p.alive = false;
      }
      broadcastRoom(currentRoom, {type:'broadcast', data: msg.data});
      broadcastRoom(currentRoom, roomState(currentRoom));
    }
    if(msg.type==='rematch'){
      if(!currentRoom) return;
      broadcastRoom(currentRoom, {type:'broadcast', data:{kind:'rematchAck'}});
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
