const Report = require('../models/Report');
const Post = require('../models/Post');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Comment = require('../models/Comment');

// @desc    Report / Flag inappropriate content
// @route   POST /api/admin/reports
// @access  Private
const reportContent = async (req, res, next) => {
  try {
    const { contentType, contentId, reason } = req.body;

    if (!contentType || !contentId || !reason) {
      res.status(400);
      throw new Error('Please add contentType, contentId, and reason for flagging');
    }

    const report = await Report.create({
      reporter: req.user.id,
      contentType,
      contentId,
      reason
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports (Moderator stream)
// @route   GET /api/admin/reports
// @access  Private (Admins or generic logged-in user for simple assignments)
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate('reporter', 'username avatarUrl');

    // To make this extra robust, let's also fetch basic details of the flagged content
    const populatedReports = [];

    for (let i = 0; i < reports.length; i++) {
      const rep = reports[i].toObject();
      let contentItem = null;

      try {
        if (rep.contentType === 'post') {
          contentItem = await Post.findById(rep.contentId).populate('author', 'username');
        } else if (rep.contentType === 'question') {
          contentItem = await Question.findById(rep.contentId).populate('author', 'username');
        } else if (rep.contentType === 'answer') {
          contentItem = await Answer.findById(rep.contentId).populate('author', 'username');
        } else if (rep.contentType === 'comment') {
          contentItem = await Comment.findById(rep.contentId).populate('author', 'username');
        }
      } catch (err) {
        console.warn(`Could not resolve content reference for report: ${rep._id}`);
      }

      rep.contentDetails = contentItem ? {
        author: contentItem.author ? contentItem.author.username : 'Unknown',
        snippet: contentItem.text || contentItem.title || contentItem.content || 'Content'
      } : { author: 'Deleted', snippet: 'Original content is missing or deleted.' };

      populatedReports.push(rep);
    }

    res.json(populatedReports);
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve reported flag (Dismiss or Delete content)
// @route   POST /api/admin/reports/:id/resolve
// @access  Private
const resolveReport = async (req, res, next) => {
  try {
    const { action } = req.body; // 'dismiss' or 'delete'
    const report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404);
      throw new Error('Report not found');
    }

    if (action === 'delete') {
      // Remove original offending entity
      if (report.contentType === 'post') {
        await Post.findByIdAndDelete(report.contentId);
        await Comment.deleteMany({ post: report.contentId });
      } else if (report.contentType === 'question') {
        await Question.findByIdAndDelete(report.contentId);
        await Answer.deleteMany({ question: report.contentId });
      } else if (report.contentType === 'answer') {
        await Answer.findByIdAndDelete(report.contentId);
      } else if (report.contentType === 'comment') {
        await Comment.findByIdAndDelete(report.contentId);
      }
    }

    report.status = 'resolved';
    await report.save();

    res.json({ message: `Report successfully resolved via action: ${action}`, status: report.status });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  reportContent,
  getReports,
  resolveReport
};
