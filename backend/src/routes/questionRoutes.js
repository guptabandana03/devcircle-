const express = require('express');
const router = express.Router();
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  voteQuestion,
  createAnswer,
  getQuestionAnswers,
  voteAnswer,
  acceptAnswer
} = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');

// Question generic paths
router.route('/')
  .post(protect, createQuestion)
  .get(getQuestions);

router.route('/:id')
  .get(getQuestionById);

router.post('/:id/vote', protect, voteQuestion);

// Answers generic paths
router.route('/:id/answers')
  .post(protect, createAnswer)
  .get(getQuestionAnswers);

router.post('/answers/:id/vote', protect, voteAnswer);
router.post('/answers/:id/accept', protect, acceptAnswer);

module.exports = router;
