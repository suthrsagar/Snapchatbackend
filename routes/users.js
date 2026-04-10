const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// Get all users for chat list (only friends)
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'username profilePic online');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (for search recommendations)
router.get('/all', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username profilePic online friends')
      .limit(20);
    
    // Check request status
    const results = await Promise.all(users.map(async (u) => {
      const isFriend = u.friends && u.friends.some(id => id.toString() === req.user._id.toString());
      const pendingRequest = await FriendRequest.findOne({
        $or: [
          { sender: req.user._id, receiver: u._id, status: 'pending' },
          { sender: u._id, receiver: req.user._id, status: 'pending' }
        ]
      });
      
      return {
        ...u._doc,
        isFriend,
        hasPendingRequest: !!pendingRequest,
        isSender: pendingRequest?.sender.toString() === req.user._id.toString()
      };
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users by @ID (username)
router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length === 0) return res.json([]);
    
    const trimmedQuery = query.trim().replace('@', ''); 
    console.log(`Searching for: ${trimmedQuery}`);

    // 1. Try exact match first (case-insensitive)
    let users = await User.find({
      $or: [
        { username: trimmedQuery },
        { email: trimmedQuery }
      ],
      _id: { $ne: req.user._id }
    }).select('username profilePic online friends').limit(5);

    // 2. If not enough exact matches, use regex
    if (users.length < 5) {
      const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const moreUsers = await User.find({
        $or: [
          { username: { $regex: escapedQuery, $options: 'i' } },
          { email: { $regex: escapedQuery, $options: 'i' } }
        ],
        _id: { $ne: req.user._id, $nin: users.map(u => u._id) }
      }).select('username profilePic online friends').limit(15);
      
      users = [...users, ...moreUsers];
    }
    
    console.log(`Search result count: ${users.length}`);

    // Check request status for each user
    const results = await Promise.all(users.map(async (u) => {
      const isFriend = u.friends && u.friends.some(id => id.toString() === req.user._id.toString());
      
      const pendingRequest = await FriendRequest.findOne({
        $or: [
          { sender: req.user._id, receiver: u._id, status: 'pending' },
          { sender: u._id, receiver: req.user._id, status: 'pending' }
        ]
      });
      
      return {
        ...u._doc,
        isFriend,
        hasPendingRequest: !!pendingRequest,
        isSender: pendingRequest?.sender.toString() === req.user._id.toString()
      };
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send Friend Request
router.post('/friend-request', protect, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // Check if already friends
    const user = await User.findById(req.user._id);
    if (user.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request exists
    const existingReq = await FriendRequest.findOne({
      sender: req.user._id,
      receiver: receiverId
    });
    if (existingReq) return res.status(400).json({ message: 'Request already sent' });

    await FriendRequest.create({
      sender: req.user._id,
      receiver: receiverId
    });

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept Friend Request
router.post('/accept-request', protect, async (req, res) => {
  try {
    const { requestId } = req.body;
    const friendReq = await FriendRequest.findById(requestId);
    
    if (!friendReq || friendReq.status !== 'pending') {
      return res.status(404).json({ message: 'Request not found' });
    }

    friendReq.status = 'accepted';
    await friendReq.save();

    // Add to both users' friends list
    await User.findByIdAndUpdate(friendReq.sender, { $addToSet: { friends: friendReq.receiver } });
    await User.findByIdAndUpdate(friendReq.receiver, { $addToSet: { friends: friendReq.sender } });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Pending Requests
router.get('/pending-requests', protect, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'username profilePic');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove Friend
router.delete('/friend/:friendId', protect, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    // Remove from both users
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
