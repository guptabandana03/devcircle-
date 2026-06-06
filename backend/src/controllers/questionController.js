const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private
const createQuestion = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      res.status(400);
      throw new Error('Please add a title and detailed content');
    }

    const question = await Question.create({
      author: req.user.id,
      title,
      content,
      tags: tags || []
    });

    const populatedQuestion = await Question.findById(question._id).populate('author', 'username avatarUrl');
    res.status(201).json(populatedQuestion);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions (with tag filtering and sorting)
// @route   GET /api/questions
// @access  Public
const getQuestions = async (req, res, next) => {
  try {
    const { tag, sort } = req.query;
    let query = {};

    if (tag) {
      query.tags = tag;
    }

    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'votes') {
      // Sort by net votes count in application, or simply sorting by downvote/upvote array length
      sortOption = { upvotes: -1 };
    }

    const questions = await Question.find(query)
      .sort(sortOption)
      .populate('author', 'username avatarUrl')
      .populate({
        path: 'acceptedAnswer',
        select: 'author isAccepted',
        populate: { path: 'author', select: 'username' }
      });

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get question by ID
// @route   GET /api/questions/:id
// @access  Public
const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'username avatarUrl bio')
      .populate({
        path: 'acceptedAnswer',
        populate: { path: 'author', select: 'username avatarUrl' }
      });

    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote / Downvote a question
// @route   POST /api/questions/:id/vote
// @access  Private
const voteQuestion = async (req, res, next) => {
  try {
    const { direction } = req.body; // 'up' or 'down'
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    const userId = req.user.id;

    if (direction === 'up') {
      // Remove from downvotes if exists
      question.downvotes = question.downvotes.filter((id) => id.toString() !== userId);
      
      // Toggle upvote
      if (question.upvotes.includes(userId)) {
        question.upvotes = question.upvotes.filter((id) => id.toString() !== userId);
      } else {
        question.upvotes.push(userId);
      }
    } else if (direction === 'down') {
      // Remove from upvotes if exists
      question.upvotes = question.upvotes.filter((id) => id.toString() !== userId);

      // Toggle downvote
      if (question.downvotes.includes(userId)) {
        question.downvotes = question.downvotes.filter((id) => id.toString() !== userId);
      } else {
        question.downvotes.push(userId);
      }
    }

    await question.save();
    res.json({
      upvotesCount: question.upvotes.length,
      downvotesCount: question.downvotes.length,
      score: question.upvotes.length - question.downvotes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add an answer to a question
// @route   POST /api/questions/:id/answers
// @access  Private
const createAnswer = async (req, res, next) => {
  try {
    const { content } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    if (!content) {
      res.status(400);
      throw new Error('Please add answer details');
    }

    const answer = await Answer.create({
      question: req.params.id,
      author: req.user.id,
      content
    });

    const populatedAnswer = await Answer.findById(answer._id).populate('author', 'username avatarUrl');

    // Create notification for question author (if not self)
    if (question.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: question.author,
        sender: req.user.id,
        type: 'answer',
        resourceId: question._id
      });
    }

    res.status(201).json(populatedAnswer);
  } catch (error) {
    next(error);
  }
};

// @desc    Get answers for a question (accepted first, then sorted by votes)
// @route   GET /api/questions/:id/answers
// @access  Public
const getQuestionAnswers = async (req, res, next) => {
  try {
    const answers = await Answer.find({ question: req.params.id })
      .populate('author', 'username avatarUrl bio');

    // Sort: Accepted first, then net score descending
    const sortedAnswers = answers.sort((a, b) => {
      if (a.isAccepted && !b.isAccepted) return -1;
      if (!a.isAccepted && b.isAccepted) return 1;

      const scoreA = a.upvotes.length - a.downvotes.length;
      const scoreB = b.upvotes.length - b.downvotes.length;
      return scoreB - scoreA;
    });

    res.json(sortedAnswers);
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote / Downvote an answer
// @route   POST /api/questions/answers/:id/vote
// @access  Private
const voteAnswer = async (req, res, next) => {
  try {
    const { direction } = req.body;
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      res.status(404);
      throw new Error('Answer not found');
    }

    const userId = req.user.id;

    if (direction === 'up') {
      answer.downvotes = answer.downvotes.filter((id) => id.toString() !== userId);
      if (answer.upvotes.includes(userId)) {
        answer.upvotes = answer.upvotes.filter((id) => id.toString() !== userId);
      } else {
        answer.upvotes.push(userId);
      }
    } else if (direction === 'down') {
      answer.upvotes = answer.upvotes.filter((id) => id.toString() !== userId);
      if (answer.downvotes.includes(userId)) {
        answer.downvotes = answer.downvotes.filter((id) => id.toString() !== userId);
      } else {
        answer.downvotes.push(userId);
      }
    }

    await answer.save();
    res.json({
      upvotesCount: answer.upvotes.length,
      downvotesCount: answer.downvotes.length,
      score: answer.upvotes.length - answer.downvotes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept an answer
// @route   POST /api/questions/answers/:id/accept
// @access  Private
const acceptAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      res.status(404);
      throw new Error('Answer not found');
    }

    const question = await Question.findById(answer.question);
    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    // Check if current user is question author
    if (question.author.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Only the question author can accept answers');
    }

    // Toggle accept status
    const previousAcceptedAnswerId = question.acceptedAnswer;

    // Reset any currently accepted answer for this question
    await Answer.updateMany({ question: question._id }, { isAccepted: false });

    if (previousAcceptedAnswerId && previousAcceptedAnswerId.toString() === answer._id.toString()) {
      // Toggle off if clicking same accepted answer
      question.acceptedAnswer = null;
      answer.isAccepted = false;
    } else {
      // Set new accepted answer
      question.acceptedAnswer = answer._id;
      answer.isAccepted = true;

      // Create notification for answer author (if not self)
      if (answer.author.toString() !== req.user.id) {
        await Notification.create({
          recipient: answer.author,
          sender: req.user.id,
          type: 'accept',
          resourceId: question._id
        });
      }
    }

    await question.save();
    await answer.save();

    res.json({
      questionAcceptedAnswer: question.acceptedAnswer,
      answerIsAccepted: answer.isAccepted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  voteQuestion,
  createAnswer,
  getQuestionAnswers,
  voteAnswer,
  acceptAnswer
};
