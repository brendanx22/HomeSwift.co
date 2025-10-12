const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   POST /api/messages
// @desc    Send a message/inquiry
// @access  Private
router.post(
  '/',
  [
    authenticateToken,
    [
      body('property_id', 'Property ID is required').not().isEmpty(),
      body('message', 'Message is required').not().isEmpty()
    ]
  ],
  messageController.sendMessage
);

// @route   GET /api/messages/property/:propertyId
// @desc    Get all messages for a property (only property owner can access)
// @access  Private
router.get('/property/:propertyId', authenticateToken, messageController.getPropertyMessages);

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation between current user and another user
// @access  Private
router.get('/conversation/:userId', authenticateToken, messageController.getConversation);

// @route   PUT /api/messages/:messageId/read
// @desc    Mark a message as read
// @access  Private
router.put('/:messageId/read', authenticateToken, messageController.markAsRead);

module.exports = router;
