const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const User = require('./models/User');
const Story = require('./models/Story');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB Atlas Connected Successfully');

  // Socket.io integration
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', async (userId) => {
      socket.join(userId);
      socket.userId = userId;
      
      // Mark user as Online
      try {
        await User.findByIdAndUpdate(userId, { online: true });
        io.emit('presenceChange', { userId, online: true });
        console.log(`User ${userId} is Online`);
      } catch (e) {}
    });

    socket.on('typing', (data) => {
      io.to(data.receiverId).emit('typingStart', { senderId: data.senderId });
    });

    socket.on('stopTyping', (data) => {
      io.to(data.receiverId).emit('typingStop', { senderId: data.senderId });
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      if (socket.userId) {
        try {
          await User.findByIdAndUpdate(socket.userId, { 
            online: false, 
            lastSeen: new Date() 
          });
          io.emit('presenceChange', { userId: socket.userId, online: false });
          console.log(`User ${socket.userId} is Offline`);
        } catch (e) {}
      }
    });
  });

  // Make io accessible in routes
  app.set('io', io);

  // Auto-Cleanup Expired Stories every hour
  setInterval(async () => {
    try {
      const result = await Story.deleteMany({ expiresAt: { $lt: new Date() } });
      if (result.deletedCount > 0) {
         console.log(`Cleaned up ${result.deletedCount} expired stories`);
      }
    } catch (e) {
      console.log('Cleanup error', e);
    }
  }, 3600000); // 1 hour

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/chat', require('./routes/chat'));
  app.use('/api/stories', require('./routes/stories'));
  app.use('/api/upload', require('./routes/upload'));

  app.get('/', (req, res) => {
    res.send('Sendme Backend is running...');
  });

  // 404 Handler
  app.use((req, res, next) => {
    res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} across all network interfaces`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});
