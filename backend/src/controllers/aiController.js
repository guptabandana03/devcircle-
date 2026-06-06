const OpenAI = require('openai');
const Question = require('../models/Question');

// Initialize OpenAI client optionally (fallback if key is missing)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

if (!process.env.OPENROUTER_API_KEY) {
  console.log('⚠️ OPENROUTER_API_KEY not found');
}

// @desc    Rephrase a post or question ("Improve with AI")
// @route   POST /api/ai/rephrase
// @access  Private
const rephraseContent = async (req, res, next) => {
  try {
    const { content, type } = req.body;

    if (!content) {
      res.status(400);
      throw new Error('Please provide content to rephrase');
    }

    const response = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `
          You are a professional technical editor for a developer community platform.

          Improve the user's ${type || 'post'} while preserving its original meaning.

          Requirements:
          - Improve grammar and clarity.
          - Make it professional and engaging.
          - Keep it concise.
          - Keep the original intent.

          STRICT RULES:
          - Return ONLY the rewritten content.
          - Do NOT add explanations.
          - Do NOT add notes.
          - Do NOT add introductions.
          - Do NOT add quotation marks.
          - Do NOT add markdown formatting.
          - Do NOT say things like:
            "Here is the improved version"
            "I refined the content"
            "Note:"
            "Changes made:"
            - Output must contain ONLY the final rewritten text.
            `
        },
        {
          role: 'user',
          content
        }
      ]
    });

    let rephrased =
      response.choices[0].message.content;
    rephrased = rephrased
      .replace(/^["']|["']$/g, '')
      .replace(/^\*\*/g, '')
      .replace(/\*\*$/g, '')
      .trim();

    res.json({ rephrased });

  } catch (error) {
    next(error);
  }
};

// @desc    Automatically recommend relevant tags based on content
// @route   POST /api/ai/tags
// @access  Private
const recommendTags = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      res.status(400);
      throw new Error('Please provide text content to extract tags');
    }

    const response = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat',
      messages: [
    {
      role: 'system',
      content: `
      You are a programming tag extraction engine.

      Extract at most 4 relevant programming or technology tags.

      STRICT RULES:
      - Return ONLY comma-separated tags.
      - Do NOT add explanations.
      - Do NOT add introductions.
      - Do NOT add sentences.
      - Do NOT add "Here are the tags".
      - Do NOT use hashtags (#).
      - Use lowercase only.
      - Multi-word tags must use hyphens.

      Examples:

      Input:
      React Redux MongoDB Express

      Output:
      react,redux,mongodb,express

      Input:
      Machine Learning with Python

      Output:
      machine-learning,python

      Return ONLY tags.
     `
    },
    {
      role: 'user',
      content: text
    }
  ]
});

const tagsString =
  response.choices[0].message.content;

const tags = tagsString
  .split(',')
  .map(tag => tag.trim().toLowerCase())
  .filter(Boolean);

res.json({ tags });
      } catch (error) {
      next(error);
      }
};

// @desc    Warn the user if a question is too vague or lacks detail
// @route   POST /api/ai/validate-question
// @access  Private
const validateQuestion = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400);
      throw new Error('Please provide title and content to validate');
    }

    const response =
await openai.chat.completions.create({
  model: 'deepseek/deepseek-chat',
  messages: [
    {
      role: 'system',
      content: `
Return ONLY valid JSON.

Example:
{
  "isValid": true,
  "warnings": [],
  "score": 85
}
`
    },
    {
      role: 'user',
      content: `
Analyze this developer question.

Title:
${title}

Content:
${content}
`
    }
  ]
});

const raw =
  response.choices[0].message.content;

const cleaned = raw
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim();

const parsed = JSON.parse(cleaned);

res.json(parsed);

} catch (error) {
    next(error);
  }

};

const suggestSimilarQuestions = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        message: 'Title or content required'
      });
    }

    const searchText = `${title || ''} ${content || ''}`;

    const questions = await Question.find({
      $or: [
        {
          title: {
            $regex: searchText.split(' ')[0],
            $options: 'i'
          }
        },
        {
          content: {
            $regex: searchText.split(' ')[0],
            $options: 'i'
          }
        }
      ]
    })
      .limit(5)
      .select('_id title');

    res.json(questions);
  } catch (error) {
    next(error);
  }
};




module.exports = {
  rephraseContent,
  recommendTags,
  validateQuestion,
  suggestSimilarQuestions
};
