import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  // Room state management
  const rooms = new Map<string, Map<string, any>>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId, userProfile) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      const room = rooms.get(roomId)!;
      
      const userData = {
        id: socket.id,
        peerId: userProfile.peerId,
        name: userProfile.name,
        avatar: userProfile.avatar,
        isMuted: true,
        status: 'online'
      };
      
      room.set(socket.id, userData);

      // Send current users to the new user
      const usersInRoom = Array.from(room.values());
      socket.emit("room-users", usersInRoom);

      // Broadcast to others that a new user joined
      socket.to(roomId).emit("user-joined", userData);

      socket.on("disconnect", () => {
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
        io.to(roomId).emit("user-left", socket.id);
      });

      socket.on("toggle-mute", (isMuted) => {
        if (room.has(socket.id)) {
          const user = room.get(socket.id)!;
          user.isMuted = isMuted;
          room.set(socket.id, user);
          io.to(roomId).emit("user-muted", { userId: socket.id, isMuted });
        }
      });

      socket.on("update-status", (status) => {
        if (room.has(socket.id)) {
          const user = room.get(socket.id)!;
          user.status = status;
          room.set(socket.id, user);
          io.to(roomId).emit("user-status-changed", { userId: socket.id, status });
        }
      });

      // WebRTC Signaling
      socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", payload);
      });

      socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", payload);
      });

      socket.on("ice-candidate", (payload) => {
        io.to(payload.target).emit("ice-candidate", payload);
      });
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
