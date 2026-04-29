const express = require('express');
const { getLiveDashboard, getStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.get('/live', authorize('admin', 'superAdmin'), getLiveDashboard);
router.get('/stats', authorize('admin', 'superAdmin'), getStats);

module.exports = router;
