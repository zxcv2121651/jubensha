import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { scripts, rooms, users, roomStates, reviews, storeItems, notifications, reports, achievements, directMessages, matchmakingQueues, rankedQueues, gameResults, gameReplays, clubs, gachaPool, promoCodes, ugcDrafts } from './data';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] } });

const getChatKey = (id1: string, id2: string) => [id1, id2].sort().join('_');

// --- ELO Calculation Helper ---
function getRankTier(elo: number): string {
  if (elo >= 1500) return '王者';
  if (elo >= 1400) return '钻石';
  if (elo >= 1200) return '黄金';
  if (elo >= 1000) return '白银';
  return '青铜';
}

function updateElo(userElo: number, avgRoomElo: number, won: boolean): number {
  const K = 32; // Max swing
  const expectedWinChance = 1 / (1 + Math.pow(10, (avgRoomElo - userElo) / 400));
  const actualResult = won ? 1 : 0;
  return Math.round(userElo + K * (actualResult - expectedWinChance));
}


// --- Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Auth APIs ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    if (user.accountStatus === 'banned') return res.status(403).json({ success: false, message: 'Account is banned' });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: { token: `fake-jwt-token-${user.id}`, user: safeUser } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});
app.post('/api/auth/register', (req, res) => {
  const { username, password, name } = req.body;
  if (users.find(u => u.username === username)) return res.status(400).json({ success: false, message: 'Username exists' });
  const newUser = {
    id: `user_${Date.now()}`, username, password, name: name || username, bio: '', avatar: 'https://picsum.photos/seed/new/150/150',
    stats: { played: 0, favorites: 0, reviews: 0, rating: 0 }, history: [], favorites: [], friends: [], blacklist: [], inventory: [], library: [], achievements: [], balance: 0,
    isVip: false, vipExpiry: null, dmTipsReceived: 0, quests: [], clubId: null, wishlist: [], checkinStreak: 0, lastCheckin: 0, isAdmin: false, accountStatus: 'active',
    elo: 1000, rank: '青铜', rankedWins: 0, rankedLosses: 0 // New player defaults to 1000 ELO (Bronze)
  };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, data: { token: `fake-jwt-token-${newUser.id}`, user: safeUser } });
});

// --- Casual Matchmaking Queue ---
app.post('/api/matchmaking/join', (req, res) => {
  const { userId, scriptId } = req.body;
  if (!matchmakingQueues[scriptId]) matchmakingQueues[scriptId] = [];
  if (!matchmakingQueues[scriptId].includes(userId)) matchmakingQueues[scriptId].push(userId);

  // Auto-pop logic (simplified)
  const script = scripts.find(s => s.id === scriptId);
  const requiredPlayers = script ? (script.players.male + script.players.female + script.players.any) : 6;
  if (matchmakingQueues[scriptId].length >= requiredPlayers) {
    const matchedUsers = matchmakingQueues[scriptId].splice(0, requiredPlayers);
    const newRoom = { id: `room_casual_${Date.now()}`, scriptId, host: 'SYSTEM', currentPlayers: requiredPlayers, targetPlayers: requiredPlayers, status: 'playing', players: matchedUsers, password: '', isPublic: false, isRanked: false };
    rooms.push(newRoom);
    roomStates[newRoom.id] = { currentAct: 'act_1', revealedClues: [], chatLog: [], roleAssignments: {}, votes: {}, isPaused: false };
    matchedUsers.forEach(uId => io.to(uId).emit('matchFound', { room: newRoom }));
  }

  res.json({ success: true, data: { queueLength: matchmakingQueues[scriptId] ? matchmakingQueues[scriptId].length : 1 } });
});
app.post('/api/matchmaking/leave', (req, res) => {
  const { userId, scriptId } = req.body;
  if (matchmakingQueues[scriptId]) matchmakingQueues[scriptId] = matchmakingQueues[scriptId].filter(id => id !== userId);
  res.json({ success: true });
});

// --- Ranked Matchmaking (ELO System) ---
app.post('/api/ranked/matchmaking/join', (req, res) => {
  const { userId, scriptId } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const userRank = user.rank || getRankTier(user.elo); // e.g., '黄金'
  if (!rankedQueues[userRank]) rankedQueues[userRank] = {};
  if (!rankedQueues[userRank][scriptId]) rankedQueues[userRank][scriptId] = [];

  if (!rankedQueues[userRank][scriptId].includes(userId)) {
    rankedQueues[userRank][scriptId].push(userId);
  }

  const script = scripts.find(s => s.id === scriptId);
  const requiredPlayers = script ? (script.players.male + script.players.female + script.players.any) : 6;

  // Pop the queue if we have enough players of the same rank
  if (rankedQueues[userRank][scriptId].length >= requiredPlayers) {
    const matchedUsers = rankedQueues[userRank][scriptId].splice(0, requiredPlayers);
    const newRoom = {
      id: `room_ranked_${Date.now()}`, scriptId, host: 'SYSTEM_RANKED',
      currentPlayers: requiredPlayers, targetPlayers: requiredPlayers,
      status: 'playing', players: matchedUsers, password: '', isPublic: false,
      isRanked: true, rankTier: userRank // The room locks into this tier
    };
    rooms.push(newRoom);
    roomStates[newRoom.id] = { currentAct: 'act_1', revealedClues: [], chatLog: [], roleAssignments: {}, votes: {}, isPaused: false };

    // Broadcast to users (in a real app, users join a socket room representing their own ID to receive direct messages)
    matchedUsers.forEach(uId => io.to(uId).emit('matchFound', { room: newRoom }));
  }

  res.json({ success: true, data: { rankTier: userRank, queueLength: rankedQueues[userRank][scriptId].length } });
});

app.post('/api/ranked/matchmaking/leave', (req, res) => {
  const { userId, scriptId } = req.body;
  const user = users.find(u => u.id === userId);
  if (user) {
    const userRank = user.rank || getRankTier(user.elo);
    if (rankedQueues[userRank] && rankedQueues[userRank][scriptId]) {
      rankedQueues[userRank][scriptId] = rankedQueues[userRank][scriptId].filter((id:string) => id !== userId);
    }
  }
  res.json({ success: true });
});

app.get('/api/ranked/leaderboard', (req, res) => {
  // Return top 10 users by ELO
  const sortedUsers = [...users].sort((a, b) => b.elo - a.elo).slice(0, 10);
  const data = sortedUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, elo: u.elo, rank: u.rank, wins: u.rankedWins, losses: u.rankedLosses }));
  res.json({ success: true, data });
});

// Ranked Game Result & ELO calculation
app.post('/api/ranked/rooms/:id/result', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room || !room.isRanked) return res.status(404).json({ success: false, message: 'Ranked room not found' });

  const { winners } = req.body; // Array of user IDs who won (e.g. successfully guessed the killer, or killer successfully escaped)
  if (!Array.isArray(winners)) return res.status(400).json({ success: false, message: 'Must provide winners array' });

  room.status = 'finished';

  // Calculate average ELO of the room
  const roomPlayers = room.players.map((pid:string) => users.find((u:any) => u.id === pid)).filter(Boolean);
  if (roomPlayers.length === 0) return res.status(400).json({ success: false });

  const avgRoomElo = roomPlayers.reduce((sum:number, p:any) => sum + p.elo, 0) / roomPlayers.length;

  const eloChanges: any[] = [];

  // Update ELO for each player in the room
  roomPlayers.forEach((p:any) => {
    const didWin = winners.includes(p.id);
    const oldElo = p.elo;

    // Calculate new ELO based on win/loss against the room average
    const newElo = updateElo(oldElo, avgRoomElo, didWin);
    const eloDelta = newElo - oldElo;

    p.elo = newElo;
    p.rank = getRankTier(newElo); // Update rank tier (e.g. Bronze -> Silver)

    if (didWin) p.rankedWins += 1;
    else p.rankedLosses += 1;

    p.stats.played += 1;

    eloChanges.push({ userId: p.id, didWin, oldElo, newElo, eloDelta, newRank: p.rank });
  });

  gameResults[room.id] = { roomId: room.id, isRanked: true, winners, eloChanges, timestamp: Date.now() };
  io.to(room.id).emit('rankedGameEnded', { results: gameResults[room.id] });

  res.json({ success: true, data: gameResults[room.id] });
});


// --- Other Endpoints (Truncated for brevity, but still functioning normally if added) ---
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if(user) {
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Make socket.io join user's own private room to receive matchFound events
io.on('connection', (socket: Socket) => {
  socket.on('identify', (userId: string) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} identified as user ${userId}`);
  });
  socket.on('joinRoom', (roomId: string) => socket.join(roomId));
});

server.listen(process.env.PORT || 3001);
