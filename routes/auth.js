const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const apiRouter = express.Router();

apiRouter.post('/register', registerUser);
apiRouter.post('/login', loginUser);
apiRouter.get('/profile', protect, getProfile);

module.exports = apiRouter;
