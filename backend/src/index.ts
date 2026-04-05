import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { scripts, rooms, users, roomStates, reviews } from './data';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// --- Scripts APIs ---
app.get('/api/scripts', (req, res) => {
  res.json({ success: true, data: scripts });
});

app.get('/api/scripts/:id', (req, res) => {
  const script = scripts.find(s => s.id === req.params.id);
  if (script) {
    res.json({ success: true, data: script });
  } else {
    res.status(404).json({ success: false, message: 'Script not found' });
  }
});

app.get('/api/scripts/:id/reviews', (req, res) => {
  const scriptReviews = reviews.filter(r => r.scriptId === req.params.id);
  res.json({ success: true, data: scriptReviews });
});

app.post('/api/scripts/:id/reviews', (req, res) => {
  const { userId, user, rating, content } = req.body;
  if (!userId || !user || !rating || !content) {
    return res.status(400).json({ success: false, message: 'Missing review fields' });
  }

  const newReview = {
    id: `r_${Date.now()}`,
    scriptId: req.params.id,
    userId,
    user,
    rating,
    content,
    date: new Date().toISOString().split('T')[0]
  };

  reviews.push(newReview);
  res.status(201).json({ success: true, data: newReview });
});

// --- User APIs ---
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    res.json({ success: true, data: user });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { name, bio, avatar } = req.body;
  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (avatar) user.avatar = avatar;

  res.json({ success: true, data: user });
});

app.post('/api/users/:id/favorites', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { scriptId } = req.body;
  if (!scriptId) return res.status(400).json({ success: false, message: 'Missing scriptId' });

  if (!user.favorites.includes(scriptId)) {
    user.favorites.push(scriptId);
  }

  res.json({ success: true, data: user.favorites });
});

app.delete('/api/users/:id/favorites/:scriptId', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.favorites = user.favorites.filter(id => id !== req.params.scriptId);
  res.json({ success: true, data: user.favorites });
});


// --- Rooms APIs ---
app.get('/api/rooms', (req, res) => {
  res.json({ success: true, data: rooms });
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room) {
    res.json({ success: true, data: room });
  } else {
    res.status(404).json({ success: false, message: 'Room not found' });
  }
});

app.post('/api/rooms', (req, res) => {
  const { scriptId, host } = req.body;
  if (!scriptId || !host) {
    return res.status(400).json({ success: false, message: 'Missing scriptId or host' });
  }

  const script = scripts.find(s => s.id === scriptId);
  if (!script) {
    return res.status(404).json({ success: false, message: 'Script not found' });
  }

  const newRoom = {
    id: `room_${Date.now()}`,
    scriptId,
    host,
    currentPlayers: 1,
    targetPlayers: script.players.male + script.players.female + script.players.any,
    status: 'waiting',
    players: [host]
  };

  rooms.push(newRoom);

  roomStates[newRoom.id] = {
    currentAct: 'act_1',
    revealedClues: [],
    chatLog: [],
    roleAssignments: {},
    votes: {}
  };

  res.status(201).json({ success: true, data: newRoom });
});

app.post('/api/rooms/:id/join', (req, res) => {
  const { userId } = req.body;
  const room = rooms.find(r => r.id === req.params.id);

  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

  if (room.players.includes(userId)) {
    return res.status(400).json({ success: false, message: 'User already in room' });
  }
  if (room.currentPlayers >= room.targetPlayers) {
    return res.status(400).json({ success: false, message: 'Room is full' });
  }

  room.players.push(userId);
  room.currentPlayers += 1;

  io.to(room.id).emit('playerJoined', { userId, room });
  res.json({ success: true, data: room });
});

app.post('/api/rooms/:id/leave', (req, res) => {
  const { userId } = req.body;
  const room = rooms.find(r => r.id === req.params.id);

  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId' });

  room.players = room.players.filter(p => p !== userId);
  room.currentPlayers = Math.max(0, room.currentPlayers - 1);

  io.to(room.id).emit('playerLeft', { userId, room });
  res.json({ success: true, data: room });
});

// --- Game Flow APIs ---
app.post('/api/rooms/:id/start', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  const script = scripts.find(s => s.id === room.scriptId);
  if (!script) return res.status(404).json({ success: false, message: 'Script not found' });

  // Basic role assignment simulation
  const state = roomStates[room.id];
  const availableRoles = [...(script.roles || [])];

  room.players.forEach(userId => {
    if (availableRoles.length > 0) {
      const role = availableRoles.pop();
      if(role) state.roleAssignments[userId] = role.id;
    }
  });

  room.status = 'playing';
  io.to(room.id).emit('gameStarted', { room, roleAssignments: state.roleAssignments });

  res.json({ success: true, data: room, roleAssignments: state.roleAssignments });
});

app.post('/api/rooms/:id/end', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  room.status = 'finished';
  io.to(room.id).emit('gameEnded', { room });

  res.json({ success: true, data: room });
});

// --- Voting APIs ---
app.post('/api/rooms/:id/vote', (req, res) => {
  const { voterId, targetRoleId } = req.body;
  const state = roomStates[req.params.id];

  if (!state) return res.status(404).json({ success: false, message: 'Room state not found' });
  if (!voterId || !targetRoleId) return res.status(400).json({ success: false, message: 'Missing voterId or targetRoleId' });

  state.votes[voterId] = targetRoleId;
  io.to(req.params.id).emit('voteCast', { voterId, targetRoleId });

  res.json({ success: true, data: state.votes });
});

app.get('/api/rooms/:id/vote', (req, res) => {
  const state = roomStates[req.params.id];
  if (!state) return res.status(404).json({ success: false, message: 'Room state not found' });

  res.json({ success: true, data: state.votes });
});


// --- Game State Modifiers ---
app.get('/api/rooms/:id/state', (req, res) => {
  const state = roomStates[req.params.id];
  if (state) {
    res.json({ success: true, data: state });
  } else {
    res.status(404).json({ success: false, message: 'Game state not found for this room' });
  }
});

app.post('/api/rooms/:id/state/clues', (req, res) => {
  const { clueId } = req.body;
  const roomId = req.params.id;
  const state = roomStates[roomId];

  if (!state) return res.status(404).json({ success: false, message: 'Room state not found' });
  if (!clueId) return res.status(400).json({ success: false, message: 'Missing clueId' });

  if (!state.revealedClues.includes(clueId)) {
    state.revealedClues.push(clueId);
    io.to(roomId).emit('clueRevealed', { clueId, state });
  }

  res.json({ success: true, data: state });
});

app.post('/api/rooms/:id/state/act', (req, res) => {
  const { actId } = req.body;
  const roomId = req.params.id;
  const state = roomStates[roomId];

  if (!state) return res.status(404).json({ success: false, message: 'Room state not found' });
  if (!actId) return res.status(400).json({ success: false, message: 'Missing actId' });

  state.currentAct = actId;
  io.to(roomId).emit('actChanged', { actId, state });

  res.json({ success: true, data: state });
});

// --- Socket.io Handlers ---
io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId: string, userId: string) => {
    socket.join(roomId);
    console.log(`User ${userId} (${socket.id}) joined socket room ${roomId}`);
  });

  socket.on('chatMessage', (roomId: string, message: { userId: string, text: string }) => {
    const state = roomStates[roomId];
    if (state) {
      const chatMsg = { ...message, timestamp: Date.now() };
      state.chatLog.push(chatMsg);
      io.to(roomId).emit('chatMessage', chatMsg);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
