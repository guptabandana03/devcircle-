const express = require('express');
const router = express.Router();
const {
  getMessagesWithUser,
  getRecentConversations,
  getNotifications,
  markNotificationsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getRecentConversations);
router.get('/messages/:userId', protect, getMessagesWithUser);

router.route('/notifications')
  .get(protect, getNotifications)
  .put(protect, markNotificationsRead);

module.exports = router;
