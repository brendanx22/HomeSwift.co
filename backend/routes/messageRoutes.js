const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all conversations for the current user
router.get('/conversations', messageController.getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Send a message
router.post('/conversations/:conversationId/messages', messageController.sendMessage);

// Create or get existing conversation with a user
router.post('/conversations', messageController.createConversation);

// Mark messages as read
router.put('/conversations/:conversationId/messages/read', messageController.markAsRead);

// Delete a message
router.delete('/messages/:messageId', messageController.deleteMessage);

// WebRTC signaling endpoints
router.post('/webrtc/offer', messageController.handleWebRTCOffer);
router.post('/webrtc/answer', messageController.handleWebRTCAnswer);
router.post('/webrtc/ice-candidate', messageController.handleWebRTCIceCandidate);

// Get online users for WebRTC connections
router.get('/online-users', messageController.getOnlineUsers);

module.exports = router;
