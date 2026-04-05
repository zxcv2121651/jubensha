import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { scripts, rooms, users, roomStates, reviews, storeItems, notifications, reports, achievements, directMessages, matchmakingQueues } from './data';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const getChatKey = (id1: string, id2: string) => [id1, id2].sort().join('_');

// --- Health Check & Mock Uploads ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/upload', (req, res) => {
  // Mocking file upload returning a pic url
  res.json({ success: true, data: { url: `https://picsum.photos/seed/${Date.now()}/400/400` } });
});

// --- Auth APIs ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: { token: `fake-jwt-token-${user.id}`, user: safeUser } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});
app.post('/api/auth/register', (req, res) => {
  const { username, password, name } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }
  const newUser = {
    id: `user_${Date.now()}`, username, password, name: name || username, bio: '', avatar: 'https://picsum.photos/seed/new/150/150',
    stats: { played: 0, favorites: 0, reviews: 0, rating: 0 }, history: [], favorites: [], friends: [], inventory: [], library: [], achievements: [], balance: 0
  };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, data: { token: `fake-jwt-token-${newUser.id}`, user: safeUser } });
});

// --- Scripts & Reviews APIs ---
app.get('/api/scripts', (req, res) => {
  let result = [...scripts];
  if (req.query.tag) result = result.filter(s => s.tags.includes(req.query.tag as string));
  if (req.query.difficulty) result = result.filter(s => s.difficulty === req.query.difficulty);
  res.json({ success: true, data: result });
});
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

// --- User Profile, Social, Messages & Inventory APIs ---
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if(user) {
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (req.body.name) user.name = req.body.name;
  if (req.body.bio) user.bio = req.body.bio;
  if (req.body.avatar) user.avatar = req.body.avatar;
  const { password: _, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});
app.get('/api/users/:id/achievements', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false });
  const userAchvs = user.achievements.map(aid => achievements.find(a => a.id === aid)).filter(Boolean);
  res.json({ success: true, data: userAchvs });
});
app.get('/api/users/:id/friends', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const friendsData = user.friends.map(fid => {
    const f = users.find(u => u.id === fid);
    if(f) { const { password: _, ...sf } = f; return sf; }
    return null;
  }).filter(Boolean);
  res.json({ success: true, data: friendsData });
});
app.post('/api/users/:id/friends/:friendId', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user && !user.friends.includes(req.params.friendId)) user.friends.push(req.params.friendId);
  res.json({ success: true, data: user?.friends });
});
app.get('/api/users/:id/messages/:friendId', (req, res) => {
  const chatKey = getChatKey(req.params.id, req.params.friendId);
  const msgs = directMessages[chatKey] || [];
  res.json({ success: true, data: msgs });
});
app.post('/api/users/:id/messages/:friendId', (req, res) => {
  const chatKey = getChatKey(req.params.id, req.params.friendId);
  if (!directMessages[chatKey]) directMessages[chatKey] = [];
  const msg = { id: `dm_${Date.now()}`, senderId: req.params.id, text: req.body.text, timestamp: Date.now() };
  directMessages[chatKey].push(msg);
  res.status(201).json({ success: true, data: msg });
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
app.post('/api/users/:id/inventory', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  const item = storeItems.find(i => i.id === req.body.itemId);
  if (user && item && !user.inventory.includes(item.id as never)) {
    (user.inventory as string[]).push(item.id);
  }
  res.json({ success: true, data: user?.inventory });
});
app.post('/api/users/:id/library', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  const script = scripts.find(s => s.id === req.body.scriptId);
  if (user && script && !user.library.includes(script.id)) {
    user.library.push(script.id);
  }
  res.json({ success: true, data: user?.library });
});
app.get('/api/users/:id/notifications', (req, res) => {
  res.json({ success: true, data: notifications.filter(n => n.userId === req.params.id) });
});
app.post('/api/users/:id/notifications/:notifId/read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.notifId && n.userId === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true, data: notif });
});

// --- System APIs (Leaderboard, Store, Reports, Matchmaking) ---
app.get('/api/leaderboard', (req, res) => {
  const sortedUsers = [...users].sort((a, b) => b.stats.played - a.stats.played).slice(0, 10);
  const data = sortedUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, played: u.stats.played, rating: u.stats.rating }));
  res.json({ success: true, data });
});
app.post('/api/reports', (req, res) => {
  const { reporterId, targetId, targetType, reason } = req.body;
  const newReport = { id: `rep_${Date.now()}`, reporterId, targetId, targetType, reason, status: 'pending', createdAt: Date.now() };
  reports.push(newReport);
  res.status(201).json({ success: true, data: newReport });
});
app.get('/api/store/items', (req, res) => res.json({ success: true, data: storeItems }));
app.post('/api/store/buy', (req, res) => {
  const { userId, itemId } = req.body;
  const user = users.find(u => u.id === userId);
  const item = storeItems.find(i => i.id === itemId);
  if (!user || !item) return res.status(404).json({ success: false, message: 'User or item not found' });
  if (user.balance < item.price) return res.status(400).json({ success: false, message: 'Insufficient balance' });

  user.balance -= item.price;
  if (!user.inventory.includes(item.id as never)) {
    (user.inventory as string[]).push(item.id);
  }
  res.json({ success: true, data: { balance: user.balance, inventory: user.inventory } });
});

app.post('/api/matchmaking/join', (req, res) => {
  const { userId, scriptId } = req.body;
  if (!matchmakingQueues[scriptId]) matchmakingQueues[scriptId] = [];
  if (!matchmakingQueues[scriptId].includes(userId)) {
    matchmakingQueues[scriptId].push(userId);
  }
  res.json({ success: true, data: { queueLength: matchmakingQueues[scriptId].length } });
});
app.post('/api/matchmaking/leave', (req, res) => {
  const { userId, scriptId } = req.body;
  if (matchmakingQueues[scriptId]) {
    matchmakingQueues[scriptId] = matchmakingQueues[scriptId].filter(id => id !== userId);
  }
  res.json({ success: true });
});
app.get('/api/matchmaking/status', (req, res) => {
  res.json({ success: true, data: matchmakingQueues });
});

// --- Rooms APIs ---
app.get('/api/rooms', (req, res) => res.json({ success: true, data: rooms }));
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  room ? res.json({ success: true, data: room }) : res.status(404).json({ success: false, message: 'Room not found' });
});
app.post('/api/rooms', (req, res) => {
  const { scriptId, host, password, isPublic } = req.body;
  const script = scripts.find(s => s.id === scriptId);
  if (!script) return res.status(404).json({ success: false, message: 'Script not found' });
  const newRoom = { id: `room_${Date.now()}`, scriptId, host, currentPlayers: 1, targetPlayers: script.players.male + script.players.female + script.players.any, status: 'waiting', players: [host], password: password || '', isPublic: isPublic ?? true };
  rooms.push(newRoom);
  roomStates[newRoom.id] = { currentAct: 'act_1', revealedClues: [], chatLog: [], roleAssignments: {}, votes: {}, isPaused: false };
  res.status(201).json({ success: true, data: newRoom });
});
app.put('/api/rooms/:id/settings', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (req.body.password !== undefined) room.password = req.body.password;
  if (req.body.isPublic !== undefined) room.isPublic = req.body.isPublic;
  res.json({ success: true, data: room });
});
app.post('/api/rooms/:id/join', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (room.password && room.password !== req.body.password) return res.status(401).json({ success: false, message: 'Invalid password' });
  if (req.body.userId && !room.players.includes(req.body.userId) && room.currentPlayers < room.targetPlayers) {
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
app.post('/api/rooms/:id/state/pause', (req, res) => {
  const state = roomStates[req.params.id];
  if (state) {
    state.isPaused = req.body.isPaused;
    io.to(req.params.id).emit('gamePaused', { isPaused: state.isPaused });
  }
  res.json({ success: true, data: state });
});
app.post('/api/rooms/:id/state/reset', (req, res) => {
  const state = roomStates[req.params.id];
  if (state) {
    state.currentAct = 'act_1';
    state.revealedClues = [];
    state.chatLog = [];
    state.roleAssignments = {};
    state.votes = {};
    state.isPaused = false;
    io.to(req.params.id).emit('gameReset', { state });
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
