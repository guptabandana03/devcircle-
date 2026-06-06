const socketio = require('socket.io');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Register user
    socket.on('register', (userId) => {
      if (userId) {
        onlineUsers.set(userId.toString(), socket.id);
        socket.join(`user_${userId}`);
        console.log(`User registered: ${userId} with socket: ${socket.id}`);

        // Broadcast updated online list
        io.emit('online_users', Array.from(onlineUsers.keys()));
      }
    });

    // Handle Direct Message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, recipientId, text } = data;

        if (!senderId || !recipientId || !text) return;

        // Save message to MongoDB
        const message = await Message.create({
          sender: senderId,
          recipient: recipientId,
          text
        });

        const populatedMsg = await Message.findById(message._id)
          .populate('sender', 'username avatarUrl')
          .populate('recipient', 'username avatarUrl');

        // Check if recipient is online, send via Socket
        const recipientSocketId = onlineUsers.get(recipientId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive_message', populatedMsg);
        }

        // Also emit back to sender to confirm delivery
        socket.emit('message_sent', populatedMsg);
      } catch (err) {
        console.error(`Socket send_message error: ${err.message}`);
      }
    });

    // Handle Typing indicator
    socket.on('typing', (data) => {
      const { senderId, recipientId, isTyping } = data;
      const recipientSocketId = onlineUsers.get(recipientId.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing', { senderId, isTyping });
      }
    });

    // Handle interactive notifications (e.g. Likes, comments)
    socket.on('new_notification', (data) => {
      const { recipientId, notification } = data;
      const recipientSocketId = onlineUsers.get(recipientId.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification_alert', notification);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
      
      // Find and remove user from online registry
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User unregistered on disconnect: ${userId}`);
          break;
        }
      }

      // Broadcast updated online list
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

// Export helper to broadcast notification alerts from REST controllers
const broadcastNotification = (io, recipientId, notification) => {
  if (!io) return;
  const recipientSocketId = onlineUsers.get(recipientId.toString());
  if (recipientSocketId) {
    io.to(recipientSocketId).emit('notification_alert', notification);
  }
};

module.exports = { initSocket, broadcastNotification };
