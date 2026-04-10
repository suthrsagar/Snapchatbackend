const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// Get conversation with a user
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message
router.post('/', protect, async (req, res) => {
  const { receiverId, type, content, expiresInSeconds } = req.body;
  
  if (!receiverId || !content) {
    return res.status(400).json({ message: 'Receiver and content are required' });
  }

  try {
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      type: type || 'text',
      content,
      expiresInSeconds: expiresInSeconds || null
    });

    const io = req.app.get('io');
    io.to(receiverId).emit('newMessage', message);
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as seen + Disappearing timer
router.put('/seen/:senderId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ 
      sender: req.params.senderId, 
      receiver: req.user._id, 
      status: { $ne: 'seen' } 
    });

    if (messages.length > 0) {
      await Message.updateMany(
        { _id: { $in: messages.map(m => m._id) } },
        { $set: { status: 'seen' } }
      );

      // Disappearing logic: Delete from DB after 10 seconds
      setTimeout(async () => {
        try {
          await Message.deleteMany({ _id: { $in: messages.map(m => m._id) } });
          console.log(`Auto-deleted ${messages.length} seen messages`);
          
          // Notify users to refresh UI if they are online
          const io = req.app.get('io');
          io.to(req.user._id).emit('messagesDeleted', { senderId: req.params.senderId });
          io.to(req.params.senderId).emit('messagesDeleted', { receiverId: req.user._id });

        } catch (e) {
          console.log('Auto-delete error', e);
        }
      }, 10000); // 10 seconds
    }

    res.json({ message: 'Messages marked as seen and scheduled for deletion' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
