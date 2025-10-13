const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('full_name', 'Name is required').not().isEmpty(),
    body('user_type', 'User type is required').isIn(['renter', 'landlord'])
  ],
  authController.signup
);

// @route   POST /api/auth/signin
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/signin',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  authController.signin
);

// @route   POST /api/auth/signout
// @desc    Logout user
// @access  Public (no authentication required for logout)
router.post('/signout', authController.signout);

// @route   GET /api/auth/session
// @desc    Get current user session
// @access  Private
router.get('/session', authenticateToken, authController.getSession);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post(
  '/resend-verification',
  [
    body('email', 'Please include a valid email').isEmail()
  ],
  authController.resendVerification
);

// @route   POST /api/auth/token
// @desc    Generate a new token for a user with updated user type
// @access  Private
router.post(
  '/token',
  [
    body('user_id', 'User ID is required').not().isEmpty()
  ],
  authController.generateToken
);

module.exports = router;
