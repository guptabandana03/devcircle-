const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get message history between current user and target user
// @route   GET /api/chat/messages/:userId
// @access  Private
const getMessagesWithUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    // Fetch messages where sender/recipient are current/target user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username avatarUrl')
      .populate('recipient', 'username avatarUrl');

    // Mark messages received from target user as read
    await Message.updateMany(
      { sender: targetUserId, recipient: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Get active conversations list with last message and unread count
// @route   GET /api/chat/conversations
// @access  Private
const getRecentConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatarUrl bio')
      .populate('recipient', 'username avatarUrl bio');

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      // Find the opposite user in conversation
      const partner = msg.sender._id.toString() === currentUserId.toString()
        ? msg.recipient
        : msg.sender;

      const partnerId = partner._id.toString();

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          user: partner,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unreadCount: 0
        });
      }
    });

    // Calculate unread counts
    const conversations = Array.from(conversationsMap.values());
    for (let i = 0; i < conversations.length; i++) {
      const partnerId = conversations[i].user._id;
      const count = await Message.countDocuments({
        sender: partnerId,
        recipient: currentUserId,
        isRead: false
      });
      conversations[i].unreadCount = count;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's notifications
// @route   GET /api/chat/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatarUrl');

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user's notifications as read
// @route   PUT /api/chat/notifications
// @access  Private
const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessagesWithUser,
  getRecentConversations,
  getNotifications,
  markNotificationsRead
};
