import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Auth APIs (Refactored to Prisma) ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (user && user.password === password) {
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: { token: `fake-jwt-token-${user.id}`, user: safeUser } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, name } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        password,
        name: name || username,
        bio: '',
        avatar: 'https://picsum.photos/seed/new/150/150'
      }
    });
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, data: { token: `fake-jwt-token-${newUser.id}`, user: safeUser } });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Username already exists or invalid data' });
  }
});

// --- Scripts APIs (Refactored to Prisma) ---
app.get('/api/scripts', async (req, res) => {
  const scripts = await prisma.script.findMany();
  res.json({ success: true, data: scripts });
});

app.post('/api/scripts', async (req, res) => {
  const { title, duration, difficulty, description } = req.body;
  const newScript = await prisma.script.create({
    data: {
      title,
      duration: duration || '未知',
      difficulty: difficulty || '新手',
      description: description || ''
    }
  });
  res.status(201).json({ success: true, data: newScript });
});

app.get('/api/scripts/:id', async (req, res) => {
  const script = await prisma.script.findUnique({ where: { id: req.params.id } });
  script ? res.json({ success: true, data: script }) : res.status(404).json({ success: false, message: 'Script not found' });
});

// Seed data route for testing
app.post('/api/seed', async (req, res) => {
  await prisma.script.create({
    data: { id: '1', title: '良辰吉日', duration: '4-5小时', difficulty: '进阶', description: '民国悬疑本', rating: 9.2 }
  }).catch(() => {});

  await prisma.script.create({
    data: { id: '2', title: '长安夜行', duration: '5-6小时', difficulty: '烧脑', description: '古风武侠本', rating: 9.5 }
  }).catch(() => {});

  res.json({ success: true, message: 'Database seeded' });
});

app.get('/api/rooms', async (req, res) => {
  const rooms = await prisma.room.findMany();
  res.json({ success: true, data: rooms });
});

server.listen(process.env.PORT || 3001);
