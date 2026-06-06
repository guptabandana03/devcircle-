const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    console.log(req.body);

    const { text, imageUrl, tags } = req.body;

    if (!text) {
      res.status(400);
      throw new Error('Please add text content to your post');
    }
    console.log("Incoming tags:", tags);
    
    console.log("Tags received:", tags);

    const post = await Post.create({
      author: req.user.id,
      text,
      imageUrl: imageUrl || '',
      tags: tags || []
    });

    console.log("Saved post:", post.tags);

    const populatedPost = await Post.findById(post._id).populate('author', 'username avatarUrl');

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Get post feed (Following users + trending/recent posts)
// @route   GET /api/posts
// @access  Public (Optional auth)
const getPostsFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let authorIds = [];

    // If user is authenticated, retrieve followed IDs
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        authorIds = [...user.following, req.user.id];
      }
    }

    let filter = {};
    if (authorIds.length > 0) {
      // Feed shows posts from followed users + trending
      // To implement "followed users + trending", we fetch followed users' posts
      // and merge/fallback to other posts so the timeline is never empty
      filter = {
        $or: [
          { author: { $in: authorIds } },
          { likes: { $not: { $size: 0 } } } // count as trending if it has likes
        ]
      };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatarUrl')
      .populate({
        path: 'parentRepost',
        populate: { path: 'author', select: 'username avatarUrl' }
      });

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check if post belongs to user
    if (post.author.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized to delete this post');
    }

    await post.deleteOne();
    // Also delete any comments associated with the post
    await Comment.deleteMany({ post: req.params.id });

    res.json({ message: 'Post and comments deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
const likeUnlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    let isLiked = false;

    if (post.likes.includes(req.user.id)) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      // Like
      post.likes.push(req.user.id);
      isLiked = true;

      // Create notification for post author (if not self)
      if (post.author.toString() !== req.user.id) {
        await Notification.create({
          recipient: post.author,
          sender: req.user.id,
          type: 'like',
          resourceId: post._id
        });
      }
    }

    await post.save();
    res.json({ isLiked, likesCount: post.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Repost post (Share)
// @route   POST /api/posts/:id/repost
// @access  Private
const repostPost = async (req, res, next) => {
  try {
    const postToRepost = await Post.findById(req.params.id);

    if (!postToRepost) {
      res.status(404);
      throw new Error('Original post not found');
    }

    // Check if already reposted to avoid infinite loop
    if (postToRepost.parentRepost) {
      res.status(400);
      throw new Error('Cannot repost a repost');
    }

    let isReposted = false;

    // Toggle repost
    if (postToRepost.reposts.includes(req.user.id)) {
      // Undo repost (delete the repost object)
      postToRepost.reposts = postToRepost.reposts.filter((id) => id.toString() !== req.user.id);
      await Post.deleteOne({ author: req.user.id, parentRepost: postToRepost._id });
    } else {
      // Create a repost record
      postToRepost.reposts.push(req.user.id);
      await Post.create({
        author: req.user.id,
        text: `Reposted: ${postToRepost.text.substring(0, 100)}...`,
        parentRepost: postToRepost._id
      });
      isReposted = true;

      if (postToRepost.author.toString() !== req.user.id) {
        await Notification.create({
        recipient: postToRepost.author,
        sender: req.user.id,
        type: 'repost',
        resourceId: postToRepost._id
        });
      }
    }


    await postToRepost.save();
    res.json({ isReposted, repostsCount: postToRepost.reposts.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comments
// @access  Private
const commentPost = async (req, res, next) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    if (!text) {
      res.status(400);
      throw new Error('Please add a comment text');
    }

    const comment = await Comment.create({
      post: req.params.id,
      author: req.user.id,
      text
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'username avatarUrl');

    // Create notification for post author (if not self)
    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        resourceId: post._id,
        commentId: comment._id
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
const getPostComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl');

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatarUrl')
      .populate({
        path: 'parentRepost',
        populate: {
          path: 'author',
          select: 'username avatarUrl'
        }
      });

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
};

// @desc Get Trending Tags
// @route GET /api/posts/trending-tags
// @access Public

const getTrendingTags = async (req, res, next) => {
  try {

    const tags = await Post.aggregate([
      { $unwind: "$tags" },

      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 }
        }
      },

      {
        $sort: {
          count: -1
        }
      },

      {
        $limit: 10
      }
    ]);

    res.json(tags);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPostsFeed,
  getPostById,      // ADD THIS
  deletePost,
  likeUnlikePost,
  repostPost,
  commentPost,
  getPostComments,
  getTrendingTags
};
