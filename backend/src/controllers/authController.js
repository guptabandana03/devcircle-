const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'devcircle_super_secret_key_1337', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, bio, skills, githubUrl } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Please add all required fields: username, email, password');
    }

    // Check if user exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already registered');
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username already taken');
    }

    // Generate a premium default avatar URL (Dicebear Robohash seed)
    const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      avatarUrl,
      bio: bio || '',
      skills: skills || [],
      githubUrl: githubUrl || ''
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        skills: user.skills,
        githubUrl: user.githubUrl,
        role: user.role,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        token: generateToken(user._id)
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please add email and password');
    }

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        skills: user.skills,
        githubUrl: user.githubUrl,
        role: user.role,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
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
      role: user.role,
      followersCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
