const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  followUnfollowUser,
  searchUsers
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', searchUsers);
router.put('/profile', protect, updateUserProfile);
router.get('/profile/:username', getUserProfile);
router.post('/:id/follow', protect, followUnfollowUser);


module.exports = router;
