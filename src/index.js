import 'module-alias/register';

import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { networkInterfaces } from 'os';
import connectDB from '@config/db.js';
import authRoutes from '@routes/auth.routes.js';
import userRoutes from '@routes/user.routes.js';
import postRoutes from '@routes/post.routes.js';
import morgan from 'morgan'; // Added for request logging
import path from 'path';

import { fileURLToPath } from 'url';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();


const app = express();
const PORT = process.env.PORT || 5002;

// Enhanced middleware
app.use(morgan('dev')); // Request logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname,'..' ,'uploads')));

// Improved CORS configuration
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: true,
  exposedHeaders: ['Authorization']
}));


// Request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Improved error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection
connectDB().catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

// Create server with graceful shutdown
const server = http.createServer(app);

// Start server with error handling
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Network accessible at http://192.168.195.142:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

function getIpAddress() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}