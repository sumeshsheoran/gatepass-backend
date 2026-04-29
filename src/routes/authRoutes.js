const express = require('express');
const { body } = require('express-validator');
const { login, register, updateFcmToken, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], login);

router.post('/register', protect, authorize('superAdmin'), [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('phone').notEmpty().withMessage('Phone required'),
  body('role').isIn(['guard', 'host', 'admin', 'superAdmin']).withMessage('Invalid role'),
], register);

router.patch('/fcm-token', protect, updateFcmToken);
router.get('/me', protect, getMe);

module.exports = router;
