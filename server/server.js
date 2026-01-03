import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import './config/passport.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import invitationRoutes from './routes/invitations.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import workspaceRoutes from './routes/workspaces.js';
import teamRoutes from './routes/teams.js';
import workflowRoutes from './routes/workflows.js';
import cycleRoutes from './routes/cycles.js';
import milestoneRoutes from './routes/milestones.js';
import githubRoutes from './routes/github.js';
import slackRoutes from './routes/slack.js';
import webhookRoutes from './routes/webhooks.js';
import publicApiRoutes from './routes/publicApi.js';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from './middleware/auth.js';
import { auditLogMiddleware } from './utils/auditLogger.js';
import './jobs/reminderJob.js';
import './jobs/digestJob.js';

const app = express();
const httpServer = createServer(app);

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

// Rate Limiting - more lenient in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});
app.use('/api', limiter);

// ✅ Define allowed frontend origins
const allowedOrigins = [
  'https://worknest-frontend-jet.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// ✅ Add environment variable support for additional origins
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// ✅ Initialize Socket.IO with proper CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ Connect to MongoDB
connectDB();

// ✅ Enhanced CORS configuration for Express
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// ✅ Middleware to parse incoming JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Initialize Passport for OAuth
// ✅ Initialize Passport for OAuth
app.use(passport.initialize());
// Passport configuration is loaded via import side-effects

// ✅ Initialize audit logging middleware
app.use(auditLogMiddleware);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins 
  });
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', authenticateToken, workspaceRoutes);
app.use('/api/teams', authenticateToken, teamRoutes);
app.use('/api/workflows', authenticateToken, workflowRoutes);
app.use('/api/cycles', authenticateToken, cycleRoutes);
app.use('/api/milestones', authenticateToken, milestoneRoutes);
app.use('/api/github', authenticateToken, githubRoutes);
app.use('/api/slack', authenticateToken, slackRoutes);
app.use('/api/webhooks', authenticateToken, webhookRoutes);
app.use('/api/public', authenticateToken, publicApiRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// ✅ Enhanced Socket.io Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
  
  if (token) {
    try {
      const cleanToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.log('Socket auth error:', err.message);
      next(new Error('Authentication error'));
    }
  } else {
    console.log('No token provided for socket connection');
    next(new Error('Authentication error'));
  }
});

// ✅ Enhanced Socket.io Events with error handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId, 'Socket ID:', socket.id);

  // Join user's personal room
  socket.join(socket.userId);

  // Handle project joining with validation
  socket.on('join-project', (projectId) => {
    if (projectId) {
      socket.join(projectId);
      console.log(`User ${socket.userId} joined project ${projectId}`);
      
      // Notify other project members
      socket.to(projectId).emit('user-joined-project', {
        userId: socket.userId,
        projectId: projectId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle project leaving
  socket.on('leave-project', (projectId) => {
    if (projectId) {
      socket.leave(projectId);
      console.log(`User ${socket.userId} left project ${projectId}`);
      
      // Notify other project members
      socket.to(projectId).emit('user-left-project', {
        userId: socket.userId,
        projectId: projectId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle task updates with validation
  socket.on('task-updated', (data) => {
    if (data && data.projectId) {
      socket.to(data.projectId).emit('task-updated', {
        ...data,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle comment addition with validation
  socket.on('comment-added', (data) => {
    if (data && data.projectId) {
      socket.to(data.projectId).emit('comment-added', {
        ...data,
        addedBy: socket.userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.userId, 'Reason:', reason);
  });

  // Handle socket errors
  socket.on('error', (error) => {
    console.log('Socket error for user', socket.userId, ':', error);
  });
});

// ✅ Global error handling
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed by CORS policy',
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ Start Server with enhanced logging
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Allowed origins:`, allowedOrigins);
  console.log(`💾 MongoDB URI: ${process.env.MONGODB_URI ? '✅ Connected' : '❌ Not configured'}`);
});

export { io };