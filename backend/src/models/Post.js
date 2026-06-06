const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please add post text content'],
    trim: true,
    maxlength: [1000, 'Post content cannot exceed 1000 characters']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  tags: {
  type: [String],
  default: []
  },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  reposts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

  
  parentRepost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', PostSchema);
