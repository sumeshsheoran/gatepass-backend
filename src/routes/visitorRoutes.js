const express = require('express');
const {
  createVisitor, getVisitors, getVisitor,
  approveVisitor, denyVisitor, checkoutVisitor,
} = require('../controllers/visitorController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize('guard'),
  upload.fields([
    { name: 'visitorPhoto', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
  ]),
  createVisitor
);

router.get('/', authorize('guard', 'host', 'admin', 'superAdmin'), getVisitors);
router.get('/:id', authorize('guard', 'host', 'admin', 'superAdmin'), getVisitor);

router.patch('/:id/approve', authorize('host'), approveVisitor);
router.patch('/:id/deny', authorize('host'), denyVisitor);
router.patch('/:id/checkout', authorize('guard'), checkoutVisitor);

module.exports = router;
