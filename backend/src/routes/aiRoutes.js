const express = require('express');
const router = express.Router();
const { rephraseContent, recommendTags, validateQuestion, suggestSimilarQuestions } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/rephrase', protect, rephraseContent);
router.post('/tags', protect, recommendTags);
router.post('/validate-question', protect, validateQuestion);
router.post('/suggest-questions', protect, suggestSimilarQuestions);
module.exports = router;
