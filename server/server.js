import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import invitationRoutes from './routes/invitations.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import { authenticateToken } from './middleware/auth.js';
import './jobs/reminderJob.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ✅ Define allowed frontend origins
const allowedOrigins = [
  'https://work-nest-rho.vercel.app',
  'http://localhost:5173'
];

// ✅ Use correct CORS origin
const CLIENT_ORIGIN = process.env.CLIENT_URL || allowedOrigins[0];

// ✅ Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// ✅ Connect to MongoDB
connectDB();

// ✅ Enable CORS for HTTP routes
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Middleware to parse incoming JSON
app.use(express.json());

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// ✅ Socket.io Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
});

// ✅ Socket.io Events
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  socket.join(socket.userId);

  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.userId} joined project ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(projectId);
    console.log(`User ${socket.userId} left project ${projectId}`);
  });

  socket.on('task-updated', (data) => {
    socket.to(data.projectId).emit('task-updated', data);
  });

  socket.on('comment-added', (data) => {
    socket.to(data.projectId).emit('comment-added', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
