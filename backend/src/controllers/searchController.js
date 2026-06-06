const User = require('../models/User')
const Post = require('../models/Post')
const Question = require('../models/Question')

const globalSearch = async (req, res, next) => {
  try {
    const query = req.query.query

    if (!query) {
      return res.json({
        users: [],
        posts: [],
        questions: []
      })
    }

    const regex = new RegExp(query, 'i')

    const users = await User.find({
      username: regex
    })
      .select('username avatarUrl')
      .limit(5)

    const posts = await Post.find({
      text: regex
    })
      .populate('author', 'username')
      .limit(5)

    const questions = await Question.find({
      $or: [
        { title: regex },
        { content: regex }
      ]
    })
      .populate('author', 'username')
      .limit(5)

    res.json({
      users,
      posts,
      questions
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  globalSearch
}