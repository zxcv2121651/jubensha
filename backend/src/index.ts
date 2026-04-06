import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { scripts, rooms, users, roomStates, reviews, storeItems, notifications, reports, achievements, directMessages, matchmakingQueues, gameResults, gameReplays, clubs, gachaPool, promoCodes, ugcDrafts } from './data';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const getChatKey = (id1: string, id2: string) => [id1, id2].sort().join('_');

// --- Health Check & File Upload ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/upload', (req, res) => res.json({ success: true, data: { url: `https://picsum.photos/seed/${Date.now()}/400/400` } }));

// --- Global Search API ---
app.get('/api/search', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase();
  if (!q) return res.json({ success: true, data: { scripts: [], users: [], rooms: [] } });

  const matchedScripts = scripts.filter(s => s.title.toLowerCase().includes(q) || s.tags.some((t: string) => t.toLowerCase().includes(q)));
  const matchedUsers = users.filter(u => u.name.toLowerCase().includes(q)).map(({ password, ...u }) => u);
  const matchedRooms = rooms.filter(r => {
    const s = scripts.find(sc => sc.id === r.scriptId);
    return s && s.title.toLowerCase().includes(q) && r.isPublic;
  });

  res.json({ success: true, data: { scripts: matchedScripts, users: matchedUsers, rooms: matchedRooms } });
});

// --- AI Hint Mock ---
app.post('/api/ai/hint', (req, res) => {
  setTimeout(() => res.json({ success: true, data: { text: "从目前的线索来看，死者身上的刀伤方向很奇怪，你可以再多调查一下当晚谁去过后院。" }}), 1000);
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
    stats: { played: 0, favorites: 0, reviews: 0, rating: 0 }, history: [], favorites: [], friends: [], blacklist: [], inventory: [], library: [], achievements: [], balance: 0,
    isVip: false, vipExpiry: null, dmTipsReceived: 0, quests: [ { id: 'q_1', title: '每日首胜', reward: 50, isClaimed: false }, { id: 'q_2', title: '结交新友', reward: 20, isClaimed: false } ], clubId: null,
    wishlist: [], checkinStreak: 0, lastCheckin: 0
  };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, data: { token: `fake-jwt-token-${newUser.id}`, user: safeUser } });
});

// --- Wallet, Promo Codes & Subscriptions ---
app.post('/api/wallet/topup', (req, res) => {
  const { userId, amount } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid request' });
  user.balance += amount;
  res.json({ success: true, data: { balance: user.balance } });
});
app.post('/api/store/redeem', (req, res) => {
  const { userId, code } = req.body;
  const user = users.find(u => u.id === userId);
  const promo = promoCodes[code];
  if (!user || !promo) return res.status(400).json({ success: false, message: 'Invalid promo code' });
  if (promo.usedBy.includes(userId)) return res.status(400).json({ success: false, message: 'Code already used' });

  if (promo.type === 'balance') user.balance += promo.reward;
  promo.usedBy.push(userId);
  res.json({ success: true, data: { balance: user.balance, reward: promo.reward } });
});
app.post('/api/users/:id/subscription', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  const { planId } = req.body;
  const plan = storeItems.find(i => i.id === planId);
  if (!user || !plan) return res.status(404).json({ success: false, message: 'User or Plan not found' });
  if (user.balance < plan.price) return res.status(400).json({ success: false, message: 'Insufficient balance' });

  user.balance -= plan.price;
  user.isVip = true;
  user.vipExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  res.json({ success: true, data: { isVip: user.isVip, vipExpiry: user.vipExpiry, balance: user.balance } });
});

// --- Quests & Check-in APIs ---
app.get('/api/users/:id/quests', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  user ? res.json({ success: true, data: user.quests }) : res.status(404).json({ success: false, message: 'User not found' });
});
app.post('/api/users/:id/quests/:questId/claim', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const quest = user.quests.find((q:any) => q.id === req.params.questId);
  if (!quest || quest.isClaimed) return res.status(400).json({ success: false, message: 'Invalid or already claimed quest' });

  quest.isClaimed = true;
  user.balance += quest.reward;
  res.json({ success: true, data: { quests: user.quests, balance: user.balance } });
});
app.post('/api/users/:id/checkin', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false });

  const now = Date.now();
  const ONE_DAY = 86400000;

  if (now - user.lastCheckin < ONE_DAY) {
     return res.status(400).json({ success: false, message: 'Already checked in today' });
  }
  user.checkinStreak = (now - user.lastCheckin <= ONE_DAY * 2) ? user.checkinStreak + 1 : 1;
  user.lastCheckin = now;
  user.balance += 10 + (user.checkinStreak * 5);
  res.json({ success: true, data: { streak: user.checkinStreak, balance: user.balance } });
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
app.get('/api/scripts/:id/act/:actId', (req, res) => {
  const script = scripts.find(s => s.id === req.params.id);
  if (!script || !script.acts || !(script.acts as any)[req.params.actId]) return res.status(404).json({ success: false });
  res.json({ success: true, data: (script.acts as any)[req.params.actId] });
});
app.post('/api/scripts', (req, res) => {
  const { title, tags, players, duration, difficulty, description, roles, authorId } = req.body;
  const newScript = {
    id: `script_${Date.now()}`, title, tags: tags || [], players: players || { male:0, female:0, any:0 },
    duration: duration || '未知', difficulty: difficulty || '新手', description: description || '',
    rating: 0, roles: roles || [], isUgc: true, authorId, acts: {}
  };
  scripts.push(newScript);
  res.status(201).json({ success: true, data: newScript });
});
app.get('/api/scripts/:id/reviews', (req, res) => res.json({ success: true, data: reviews.filter(r => r.scriptId === req.params.id) }));
app.post('/api/scripts/:id/reviews', (req, res) => {
  const newReview = { id: `r_${Date.now()}`, scriptId: req.params.id, date: new Date().toISOString().split('T')[0], likes: 0, ...req.body };
  reviews.push(newReview);
  res.status(201).json({ success: true, data: newReview });
});
app.post('/api/scripts/:id/reviews/:reviewId/like', (req, res) => {
  const review = reviews.find(r => r.id === req.params.reviewId);
  if (review) {
    review.likes += 1;
    res.json({ success: true, data: review });
  } else {
    res.status(404).json({ success: false, message: 'Review not found' });
  }
});

// --- DM Tipping API ---
app.post('/api/users/:id/tip', (req, res) => {
  const targetDM = users.find(u => u.id === req.params.id);
  const { senderId, amount } = req.body;
  const sender = users.find(u => u.id === senderId);

  if (!sender || !targetDM) return res.status(404).json({ success: false, message: 'User not found' });
  if (sender.balance < amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid or insufficient balance' });

  sender.balance -= amount;
  targetDM.balance += amount;
  targetDM.dmTipsReceived += amount;

  res.json({ success: true, data: { senderBalance: sender.balance } });
});

// --- User Profile, Social, Messages, Blacklist, Wishlist & Inventory APIs ---
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
app.get('/api/users/:id/history/:historyId', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false });
  const h = user.history.find((h:any) => h.id === req.params.historyId);
  h ? res.json({ success: true, data: h }) : res.status(404).json({ success: false });
});
app.get('/api/users/:id/achievements', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false });
  const userAchvs = user.achievements.map((aid:string) => achievements.find(a => a.id === aid)).filter(Boolean);
  res.json({ success: true, data: userAchvs });
});
app.get('/api/users/:id/friends', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const friendsData = user.friends.map((fid:string) => {
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
app.get('/api/users/:id/blacklist', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  res.json({ success: true, data: user?.blacklist || [] });
});
app.post('/api/users/:id/blacklist/:targetId', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user && !user.blacklist.includes(req.params.targetId)) user.blacklist.push(req.params.targetId);
  res.json({ success: true, data: user?.blacklist });
});
app.delete('/api/users/:id/blacklist/:targetId', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user) user.blacklist = user.blacklist.filter((id:string) => id !== req.params.targetId);
  res.json({ success: true, data: user?.blacklist });
});

// Wishlist
app.post('/api/users/:id/wishlist', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (user && req.body.scriptId && !user.wishlist.includes(req.body.scriptId)) {
    user.wishlist.push(req.body.scriptId);
  }
  res.json({ success: true, data: user?.wishlist });
});

// Direct Messaging
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
  if (user) user.favorites = user.favorites.filter((id:string) => id !== req.params.scriptId);
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
  if (user && script && !user.library.includes(script.id as never)) {
    (user.library as string[]).push(script.id);
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

// Gacha/Lootbox logic
app.post('/api/store/gacha', (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);
  const GACHA_COST = 150;

  if (!user || user.balance < GACHA_COST) {
    return res.status(400).json({ success: false, message: 'Insufficient balance or user not found' });
  }

  user.balance -= GACHA_COST;
  const rand = Math.random();
  let cumulative = 0;
  let wonItem = gachaPool[gachaPool.length - 1];

  for (const item of gachaPool) {
    cumulative += item.dropRate;
    if (rand <= cumulative) { wonItem = item; break; }
  }

  if (!user.inventory.includes(wonItem.id as never)) {
     (user.inventory as string[]).push(wonItem.id);
  }
  res.json({ success: true, data: { wonItem, balance: user.balance, inventory: user.inventory } });
});

// Clubs
app.get('/api/clubs', (req, res) => {
  res.json({ success: true, data: clubs });
});
app.post('/api/clubs', (req, res) => {
  const { name, description, leaderId } = req.body;
  const newClub = { id: `club_${Date.now()}`, name, description, leaderId, members: [leaderId] };
  clubs.push(newClub);
  const user = users.find(u => u.id === leaderId);
  if (user) user.clubId = newClub.id;
  res.status(201).json({ success: true, data: newClub });
});
app.post('/api/clubs/:id/join', (req, res) => {
  const club = clubs.find(c => c.id === req.params.id);
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);

  if (!club || !user) return res.status(404).json({ success: false });
  if (!club.members.includes(userId)) club.members.push(userId);
  user.clubId = club.id;

  res.json({ success: true, data: club });
});

// DM Analytics
app.get('/api/analytics/dm/:userId', (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ success: false });

  const dmGamesHosted = rooms.filter(r => r.host === req.params.userId && r.status === 'finished').length;
  res.json({ success: true, data: { gamesHosted: dmGamesHosted, averageRating: user.stats.rating, tipsEarned: user.dmTipsReceived } });
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

// --- Rooms & Results APIs ---
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
  roomStates[newRoom.id] = { currentAct: 'act_1', revealedClues: [], chatLog: [], roleAssignments: {}, votes: {}, isPaused: false, playerInventories: { [host]: [] }, readyStatus: { [host]: false } };
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

  if (req.body.userId) {
     const user = users.find(u=>u.id===req.body.userId);
     if (user && room.players.some((p:any) => user.blacklist.includes(p))) {
        return res.status(403).json({ success: false, message: 'Cannot join room with blacklisted users' });
     }
  }

  if (req.body.userId && !room.players.includes(req.body.userId) && room.currentPlayers < room.targetPlayers) {
    room.players.push(req.body.userId);
    room.currentPlayers++;
    if (roomStates[room.id]) {
      if (!roomStates[room.id].playerInventories[req.body.userId]) roomStates[room.id].playerInventories[req.body.userId] = [];
      roomStates[room.id].readyStatus[req.body.userId] = false;
    }
    io.to(room.id).emit('playerJoined', { userId: req.body.userId, room });
  }
  res.json({ success: true, data: room });
});
app.post('/api/rooms/:id/leave', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room && req.body.userId) {
    room.players = room.players.filter((p:any) => p !== req.body.userId);
    room.currentPlayers = Math.max(0, room.currentPlayers - 1);
    if(roomStates[room.id] && roomStates[room.id].readyStatus[req.body.userId] !== undefined) {
      delete roomStates[room.id].readyStatus[req.body.userId];
    }
    io.to(room.id).emit('playerLeft', { userId: req.body.userId, room });
  }
  res.json({ success: true, data: room });
});
app.post('/api/rooms/:id/ready', (req, res) => {
  const state = roomStates[req.params.id];
  const { userId, isReady } = req.body;
  if (!state || !userId) return res.status(400).json({ success: false });
  state.readyStatus[userId] = isReady;
  io.to(req.params.id).emit('playerReadyStatusChanged', { userId, isReady });
  res.json({ success: true, data: state.readyStatus });
});

// Game Results & Replays
app.post('/api/rooms/:id/result', (req, res) => {
  const { mvpId, winningFaction, summary } = req.body;
  const result = { roomId: req.params.id, mvpId, winningFaction, summary, timestamp: Date.now() };
  gameResults[req.params.id] = result;

  const room = rooms.find(r=>r.id===req.params.id);
  if(room) {
    room.players.forEach((pid:any) => {
      const u = users.find(user => user.id === pid);
      if(u) u.stats.played++;
    });
  }

  res.json({ success: true, data: result });
});
app.get('/api/rooms/:id/result', (req, res) => {
  const result = gameResults[req.params.id];
  result ? res.json({ success: true, data: result }) : res.status(404).json({ success: false });
});
app.get('/api/rooms/:id/replay', (req, res) => {
  const replay = gameReplays[req.params.id];
  replay ? res.json({ success: true, data: replay }) : res.status(404).json({ success: false, message: 'Replay not found' });
});


// --- DM Controls ---
app.post('/api/rooms/:id/dm/kick', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  const { targetUserId, hostId } = req.body;
  if (!room || room.host !== hostId) return res.status(403).json({ success: false, message: 'Unauthorized DM action' });
  room.players = room.players.filter((p:any) => p !== targetUserId);
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
app.post('/api/rooms/:id/dm/mute-all', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  const { hostId, mute } = req.body;
  if (!room || room.host !== hostId) return res.status(403).json({ success: false, message: 'Unauthorized DM action' });

  io.to(room.id).emit('dmMuteAll', { mute });
  res.json({ success: true, message: mute ? 'All muted' : 'All unmuted' });
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

// Advanced state manipulations (机制本)
app.post('/api/rooms/:id/trade', (req, res) => {
  const state = roomStates[req.params.id];
  const { senderId, receiverId, itemId } = req.body;
  if (!state || !state.playerInventories) return res.status(404).json({ success: false });

  const senderInv = state.playerInventories[senderId] || [];
  const receiverInv = state.playerInventories[receiverId] || [];

  const itemIndex = senderInv.indexOf(itemId);
  if (itemIndex > -1) {
    senderInv.splice(itemIndex, 1);
    receiverInv.push(itemId);
    state.playerInventories[senderId] = senderInv;
    state.playerInventories[receiverId] = receiverInv;
    io.to(req.params.id).emit('itemTraded', { senderId, receiverId, itemId });
    return res.json({ success: true, data: state.playerInventories });
  }
  res.status(400).json({ success: false, message: 'Item not found in sender inventory' });
});

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
  const room = rooms.find(r => r.id === req.params.id);
  if (state && room) {
    state.currentAct = 'act_1';
    state.revealedClues = [];
    state.chatLog = [];
    state.roleAssignments = {};
    state.votes = {};
    state.isPaused = false;
    const freshInvs: any = {};
    const freshReady: any = {};
    room.players.forEach((p:any) => { freshInvs[p] = []; freshReady[p] = false; });
    state.playerInventories = freshInvs;
    state.readyStatus = freshReady;

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

// --- Admin APIs ---
const adminOnly = (req: any, res: any, next: any) => {
  const adminId = req.headers['x-admin-id'];
  const admin = users.find(u => u.id === adminId && u.isAdmin);
  if (!admin) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};

app.get('/api/admin/users', adminOnly, (req, res) => {
  res.json({ success: true, data: users.map(({ password, ...u }) => u) });
});
app.post('/api/admin/users/:id/ban', adminOnly, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false });
  user.accountStatus = req.body.status || 'banned';
  res.json({ success: true, data: { id: user.id, accountStatus: user.accountStatus } });
});
app.get('/api/admin/scripts/pending', adminOnly, (req, res) => {
  const pendingScripts = scripts.filter((s:any) => s.isUgc && s.approvalStatus === 'pending');
  res.json({ success: true, data: pendingScripts });
});
app.post('/api/admin/scripts/:id/approve', adminOnly, (req, res) => {
  const script:any = scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ success: false });
  script.approvalStatus = req.body.approved ? 'approved' : 'rejected';
  res.json({ success: true, data: script });
});
app.get('/api/admin/reports', adminOnly, (req, res) => {
  const populatedReports = reports.map(r => ({
    ...r,
    reporterName: users.find(u => u.id === r.reporterId)?.name || '未知',
    targetName: users.find(u => u.id === r.targetId)?.name || r.targetId
  }));
  res.json({ success: true, data: populatedReports });
});
app.post('/api/admin/reports/:id/resolve', adminOnly, (req, res) => {
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ success: false });
  report.status = req.body.status || 'resolved';
  res.json({ success: true, data: report });
});
app.post('/api/admin/store', adminOnly, (req, res) => {
  const newItem = { id: `item_${Date.now()}`, ...req.body };
  storeItems.push(newItem);
  res.status(201).json({ success: true, data: newItem });
});
app.post('/api/admin/promo', adminOnly, (req, res) => {
  const { code, reward, type, maxUses } = req.body;
  if (promoCodes[code]) return res.status(400).json({ success: false, message: 'Code exists' });
  promoCodes[code] = { reward, type: type || 'balance', maxUses: maxUses || 100, usedBy: [] };
  res.status(201).json({ success: true, data: { code, ...promoCodes[code] } });
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

// --- Additional Admin Controls (Rooms & Store) ---
app.get('/api/admin/rooms', adminOnly, (req, res) => {
  const populatedRooms = rooms.map(r => ({
    ...r,
    hostName: users.find(u => u.id === r.host)?.name || r.host,
    scriptName: scripts.find(s => s.id === r.scriptId)?.title || '未知剧本'
  }));
  res.json({ success: true, data: populatedRooms });
});

app.post('/api/admin/rooms/:id/close', adminOnly, (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ success: false });
  room.status = 'finished'; // Or "cancelled"
  io.to(room.id).emit('roomClosedByAdmin', { message: '房间已被管理员强制解散' });
  res.json({ success: true, data: room });
});

app.delete('/api/admin/store/:id', adminOnly, (req, res) => {
  const itemIndex = storeItems.findIndex(i => i.id === req.params.id);
  if (itemIndex === -1) return res.status(404).json({ success: false });
  const deletedItem = storeItems.splice(itemIndex, 1);
  res.json({ success: true, data: deletedItem });
});

// --- Dashboard Statistics API ---
app.get('/api/admin/stats', adminOnly, (req, res) => {
  const activeUsers = users.filter(u => u.accountStatus === 'active').length;
  const playingRooms = rooms.filter(r => r.status === 'playing').length;
  const totalRevenue = users.reduce((acc, user) => acc + (user.balance || 0), 0); // Mocking revenue via current balances
  const totalDMs = users.filter(u => u.hostedRooms && u.hostedRooms.length > 0).length || 0;

  // Mocking change percentages
  const stats = {
    totalUsers: { value: activeUsers, change: '+2%' },
    activeRooms: { value: playingRooms, change: '+5%' },
    totalDms: { value: totalDMs, change: '+1%' },
    dailyRevenue: { value: totalRevenue, change: '-1%' }
  };
  res.json({ success: true, data: stats });
});

// --- Moderation Logs API ---
// We use 'reports' array to mock logs if they are resolved
app.get('/api/admin/logs', adminOnly, (req, res) => {
  const logs = reports
    .filter(r => r.status !== 'pending')
    .map(r => ({
      id: r.id,
      action: r.status === 'resolved' ? 'Ban User' : 'Dismissed Report',
      targetId: r.targetId,
      reason: r.reason,
      createdAt: r.createdAt
    }));
  res.json({ success: true, data: logs });
});
