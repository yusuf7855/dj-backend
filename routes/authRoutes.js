const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); // Bu satırı ekleyin

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/search', authController.searchUsers);
router.post('/follow/:targetUserId', authMiddleware, authController.followUser);
router.post('/unfollow/:targetUserId', authMiddleware, authController.unfollowUser);
router.get('/user/:id', authMiddleware, authController.getUserById); // authMiddleware ekleyin
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;