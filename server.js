// Optional WebSocket rooms server. This is separate from the static website and must be deployed as a Node service.
const WebSocket = require('ws');
const server = new WebSocket.Server({port:Number(process.env.PORT)||8080});
const rooms = new Map();
const safe = s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,12)||'SALA1';
function send(ws,obj){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj))}
function emit(room){let users=rooms.get(room)||[];const players=users.map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,team:p.team}));users.forEach(p=>send(p.ws,{type:'state',players}))}
let nextId=1;
server.on('connection',ws=>{let p=null,lim=0;ws.on('message',buf=>{if(buf.length>1024)return;let msg;try{msg=JSON.parse(String(buf))}catch(e){return}if(msg.type==='join'&&!p){let room=safe(msg.room);let users=rooms.get(room)||[];if(users.length>=8){send(ws,{type:'error',message:'La sala está llena (8/8)'});return}p={id:nextId++,room,ws,name:String(msg.name||'Jugador').replace(/[<>]/g,'').slice(0,18),x:250,y:250,team:users.length%2};users.push(p);rooms.set(room,users);send(ws,{type:'welcome',id:p.id,room});emit(room)}else if(msg.type==='move'&&p){const now=Date.now();if(now-lim<45)return;lim=now;p.x=Math.max(25,Math.min(1175,Number(msg.x)||0));p.y=Math.max(25,Math.min(665,Number(msg.y)||0));emit(p.room)}});ws.on('close',()=>{if(!p)return;let users=(rooms.get(p.room)||[]).filter(u=>u!==p);if(users.length)rooms.set(p.room,users);else rooms.delete(p.room);emit(p.room)})});
console.log('RED LOCK rooms server listening on port',process.env.PORT||8080);
