const express = require('express');
const router = express.Router();
const { reportContent, getReports, resolveReport } = require('../controllers/adminController');
const { protect,adminOnly } = require('../middleware/authMiddleware');

router.route('/reports')

  // Any logged-in user can report
  .post(protect, reportContent)

  // Only admins can view reports
  .get(protect, adminOnly, getReports);

router.post(
  '/reports/:id/resolve',
  protect,
  adminOnly,
  resolveReport
);

module.exports = router;
