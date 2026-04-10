const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Generic media upload route
router.post('/image', protect, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.log('Multer Error:', err);
      return res.status(500).json({ message: 'Multer Error', error: err.message });
    }
    if (!req.file) {
      console.log('Upload failed: No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log(`File uploaded successfully: ${req.file.filename} (${req.file.size} bytes)`);
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

// Alias for video
router.post('/video', protect, (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.log('Multer Error Video:', err);
      return res.status(500).json({ message: 'Multer Error Video', error: err.message });
    }
    if (!req.file) {
      console.log('Upload failed: No video file in request');
      return res.status(400).json({ message: 'No video uploaded' });
    }
    
    console.log(`Video uploaded successfully: ${req.file.filename} (${req.file.size} bytes)`);
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

module.exports = router;
