const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Story = require('../models/Story');

// Get all recent stories
router.get('/', protect, async (req, res) => {
  try {
    // Only get stories that haven't expired
    const stories = await Story.find({
      expiresAt: { $gt: new Date() }
    }).populate('user', 'username profilePic').sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload a story
router.post('/', protect, async (req, res) => {
  const { mediaType, mediaUrl } = req.body;
  
  try {
    // Expire in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      user: req.user._id,
      mediaType,
      mediaUrl,
      expiresAt
    });

    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
