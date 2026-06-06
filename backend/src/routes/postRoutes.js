const express = require('express');
const router = express.Router();
const {
  createPost,
  getPostsFeed,
  getPostById,
  deletePost,
  likeUnlikePost,
  repostPost,
  commentPost,
  getPostComments,
  getTrendingTags
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Route configurations
router.route('/')
  .post(protect, createPost)
  .get(getPostsFeed); // public timeline (auth-optional but supported in query logic)


// Trending tags
router.get('/trending-tags', getTrendingTags);

router.route('/:id')
  .get(getPostById)
  .delete(protect, deletePost);

router.post('/:id/like', protect, likeUnlikePost);
router.post('/:id/repost', protect, repostPost);
router.route('/:id/comments')
  .post(protect, commentPost)
  .get(getPostComments);



module.exports = router;
