const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user profile by username
// @route   GET /api/users/profile/:username
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('followers', 'username avatarUrl bio')
      .populate('following', 'username avatarUrl bio');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      skills: user.skills,
      githubUrl: user.githubUrl,
      followers: user.followers,
      following: user.following,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update fields
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.skills = req.body.skills !== undefined ? req.body.skills : user.skills;
    user.githubUrl = req.body.githubUrl !== undefined ? req.body.githubUrl : user.githubUrl;
    user.avatarUrl = req.body.avatarUrl !== undefined ? req.body.avatarUrl : user.avatarUrl;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      skills: updatedUser.skills,
      githubUrl: updatedUser.githubUrl,
      followersCount: updatedUser.followers.length,
      followingCount: updatedUser.following.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow / Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
const followUnfollowUser = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      res.status(400);
      throw new Error('You cannot follow yourself');
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      res.status(404);
      throw new Error('User not found');
    }

    let isFollowing = false;

    // Toggle follow status
    if (userToFollow.followers.includes(req.user.id)) {
      // Unfollow
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== req.user.id
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== req.params.id
      );
    } else {
      // Follow
      userToFollow.followers.push(req.user.id);
      currentUser.following.push(req.params.id);
      isFollowing = true;

      // Create notification
      await Notification.create({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow',
        resourceId: currentUser._id
      });
    }

    await userToFollow.save();
    await currentUser.save();

    res.json({
      isFollowing,
      followersCount: userToFollow.followers.length,
      followingCount: userToFollow.following.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users by username or skills
// @route   GET /api/users
// @access  Public
const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.query;
    let findQuery = {};

    if (query) {
      findQuery = {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { skills: { $regex: query, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(findQuery).select('username avatarUrl bio skills followers');
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      skills: user.skills,
      followersCount: user.followers?.length || 0
   }));
   res.json(formattedUsers);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  followUnfollowUser,
  searchUsers
};
