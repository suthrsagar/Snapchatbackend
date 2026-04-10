const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text',
  },
  content: {
    type: String,
    required: true, // For images/videos, this will be the URL
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent',
  },
  expiresInSeconds: {
    type: Number,
    default: null, // Disappearing message timer if set
  },
  isDeleted: {
    type: Boolean,
    default: false, // After disappearing, we can physically delete or just set this to true
  }
}, { timestamps: true });

// Optional index for auto-deletion if we use TTL directly on mongo (but it's better to handle logic carefully since it should trigger after 'seen')
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Just an example

module.exports = mongoose.model('Message', messageSchema);
