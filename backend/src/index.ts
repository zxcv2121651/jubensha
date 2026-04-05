import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { scripts, rooms } from './data';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// REST APIs
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

app.get('/api/rooms', (req, res) => {
  res.json({ success: true, data: rooms });
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
    status: 'waiting'
  };

  rooms.push(newRoom);
  res.status(201).json({ success: true, data: newRoom });
});

// Socket.io for Real-time game state
const gameRoomsState = new Map<string, any>();

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId: string, userId: string) => {
    socket.join(roomId);
    console.log(`User ${userId} (${socket.id}) joined room ${roomId}`);

    // Broadcast to others in the room
    socket.to(roomId).emit('playerJoined', { userId, socketId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
