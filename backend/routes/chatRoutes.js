const express = require('express');
const {
  getUserChats,
  startChat,
  getMessages,
  sendMessage,
  markMessagesAsRead
} = require('../controllers/chatController');

const router = express.Router();

// Get all chats for a user
router.get('/chats/:user_id', getUserChats);

// Create or get existing chat between two users for a property
router.post('/start', startChat);

// Get messages for a specific chat
router.get('/:chat_id', getMessages);

// Send a message to a chat
router.post('/', sendMessage);

// Mark messages as read in a chat
router.put('/:chat_id/read', markMessagesAsRead);

module.exports = router;
