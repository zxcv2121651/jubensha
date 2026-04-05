import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { scripts, rooms, users, roomStates, reviews, storeItems } from './data';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

// --- Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Scripts & Reviews APIs ---
app.get('/api/scripts', (req, res) => res.json({ success: true, data: scripts }));
app.get('/api/scripts/:id', (req, res) => {
  const script = scripts.find(s => s.id === req.params.id);
  script ? res.json({ success: true, data: script }) : res.status(404).json({ success: false, message: 'Script not found' });
});
app.get('/api/scripts/:id/reviews', (req, res) => res.json({ success: true, data: reviews.filter(r => r.scriptId === req.params.id) }));
app.post('/api/scripts/:id/reviews', (req, res) => {
  const newReview = { id: `r_${Date.now()}`, scriptId: req.params.id, date: new Date().toISOString().split('T')[0], ...req.body };
  reviews.push(newReview);
  res.status(201).json({ success: true, data: newReview });
});

// --- User Profile, Social & Inventory APIs ---
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  user ? res.json({ success: true, data: user }) : res.status(404).json({ success: false, message: 'User not found' });
});
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  Object.assign(user, req.body);
  res.json({ success: true, data: user });
});
app.post('/api/users/:id/favorites', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user && req.body.scriptId && !user.favorites.includes(req.body.scriptId)) user.favorites.push(req.body.scriptId);
  res.json({ success: true, data: user?.favorites });
});
app.delete('/api/users/:id/favorites/:scriptId', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user) user.favorites = user.favorites.filter(id => id !== req.params.scriptId);
  res.json({ success: true, data: user?.favorites });
});
app.get('/api/users/:id/friends', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const friendsData = user.friends.map(fid => users.find(u => u.id === fid)).filter(Boolean);
  res.json({ success: true, data: friendsData });
});
app.post('/api/users/:id/friends/:friendId', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user && !user.friends.includes(req.params.friendId)) user.friends.push(req.params.friendId);
  res.json({ success: true, data: user?.friends });
});
app.post('/api/users/:id/inventory', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  const item = storeItems.find(i => i.id === req.body.itemId);
  if (user && item) {
     const inv = user.inventory as string[];
     if (!inv.includes(item.id)) {
        inv.push(item.id);
     }
  }
  res.json({ success: true, data: user?.inventory });
});

// --- Store APIs ---
app.get('/api/store/items', (req, res) => res.json({ success: true, data: storeItems }));

// --- Rooms APIs ---
app.get('/api/rooms', (req, res) => res.json({ success: true, data: rooms }));
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  room ? res.json({ success: true, data: room }) : res.status(404).json({ success: false, message: 'Room not found' });
});
app.post('/api/rooms', (req, res) => {
  const { scriptId, host } = req.body;
  const script = scripts.find(s => s.id === scriptId);
  if (!script) return res.status(404).json({ success: false, message: 'Script not found' });
  const newRoom = { id: `room_${Date.now()}`, scriptId, host, currentPlayers: 1, targetPlayers: script.players.male + script.players.female + script.players.any, status: 'waiting', players: [host] };
  rooms.push(newRoom);
  roomStates[newRoom.id] = { currentAct: 'act_1', revealedClues: [], chatLog: [], roleAssignments: {}, votes: {} };
  res.status(201).json({ success: true, data: newRoom });
});
app.post('/api/rooms/:id/join', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room && req.body.userId && !room.players.includes(req.body.userId) && room.currentPlayers < room.targetPlayers) {
    room.players.push(req.body.userId);
    room.currentPlayers++;
    io.to(room.id).emit('playerJoined', { userId: req.body.userId, room });
  }
  res.json({ success: true, data: room });
});
app.post('/api/rooms/:id/leave', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room && req.body.userId) {
    room.players = room.players.filter(p => p !== req.body.userId);
    room.currentPlayers = Math.max(0, room.currentPlayers - 1);
    io.to(room.id).emit('playerLeft', { userId: req.body.userId, room });
  }
  res.json({ success: true, data: room });
});

// --- DM Controls ---
app.post('/api/rooms/:id/dm/kick', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  const { targetUserId, hostId } = req.body;
  if (!room || room.host !== hostId) return res.status(403).json({ success: false, message: 'Unauthorized DM action' });
  room.players = room.players.filter(p => p !== targetUserId);
  room.currentPlayers = Math.max(0, room.currentPlayers - 1);
  io.to(room.id).emit('playerKicked', { targetUserId, room });
  res.json({ success: true, data: room });
});
app.post('/api/rooms/:id/dm/assign-role', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  const state = roomStates[req.params.id];
  const { targetUserId, roleId, hostId } = req.body;
  if (!room || room.host !== hostId || !state) return res.status(403).json({ success: false, message: 'Unauthorized DM action' });
  state.roleAssignments[targetUserId] = roleId;
  io.to(room.id).emit('roleAssigned', { targetUserId, roleId });
  res.json({ success: true, data: state.roleAssignments });
});

// --- Game Flow & State ---
app.post('/api/rooms/:id/start', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room) {
    room.status = 'playing';
    io.to(room.id).emit('gameStarted', { room });
  }
  res.json({ success: true, data: room });
});
app.post('/api/rooms/:id/end', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room) {
    room.status = 'finished';
    io.to(room.id).emit('gameEnded', { room });
  }
  res.json({ success: true, data: room });
});
app.post('/api/rooms/:id/vote', (req, res) => {
  const state = roomStates[req.params.id];
  if (state && req.body.voterId && req.body.targetRoleId) {
    state.votes[req.body.voterId] = req.body.targetRoleId;
    io.to(req.params.id).emit('voteCast', { voterId: req.body.voterId, targetRoleId: req.body.targetRoleId });
  }
  res.json({ success: true, data: state?.votes });
});
app.get('/api/rooms/:id/vote', (req, res) => res.json({ success: true, data: roomStates[req.params.id]?.votes }));

app.get('/api/rooms/:id/state', (req, res) => res.json({ success: true, data: roomStates[req.params.id] }));
app.post('/api/rooms/:id/state/clues', (req, res) => {
  const state = roomStates[req.params.id];
  if (state && req.body.clueId && !state.revealedClues.includes(req.body.clueId)) {
    state.revealedClues.push(req.body.clueId);
    io.to(req.params.id).emit('clueRevealed', { clueId: req.body.clueId, state });
  }
  res.json({ success: true, data: state });
});
app.post('/api/rooms/:id/state/act', (req, res) => {
  const state = roomStates[req.params.id];
  if (state && req.body.actId) {
    state.currentAct = req.body.actId;
    io.to(req.params.id).emit('actChanged', { actId: req.body.actId, state });
  }
  res.json({ success: true, data: state });
});

// --- Private Whisper / Chat ---
app.post('/api/rooms/:id/whisper', (req, res) => {
  const state = roomStates[req.params.id];
  const { senderId, targetId, text } = req.body;
  if (!state || !senderId || !targetId || !text) return res.status(400).json({ success: false });
  const msg = { id: `msg_${Date.now()}`, userId: senderId, targetId, text, timestamp: Date.now(), isPrivate: true };
  state.chatLog.push(msg);
  io.to(req.params.id).emit('whisperMessage', msg);
  res.json({ success: true, data: msg });
});

// --- Socket.io Handlers ---
io.on('connection', (socket: Socket) => {
  socket.on('joinRoom', (roomId: string, userId: string) => socket.join(roomId));
  socket.on('chatMessage', (roomId: string, message: { userId: string, text: string }) => {
    const state = roomStates[roomId];
    if (state) {
      const chatMsg = { id: `msg_${Date.now()}`, ...message, timestamp: Date.now(), isPrivate: false };
      state.chatLog.push(chatMsg);
      io.to(roomId).emit('chatMessage', chatMsg);
    }
  });
});

server.listen(process.env.PORT || 3001);
