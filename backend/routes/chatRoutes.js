const express = require('express');
const multer = require('multer');
const {
  getUserChats,
  startChat,
  getMessages,
  sendMessage,
  markMessagesAsRead
} = require('../controllers/chatController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
    files: 5 // Maximum 5 files per message
  },
  fileFilter: (req, file, cb) => {
    // Accept images, documents, and other common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

const router = express.Router();

// Get all chats for a user
router.get('/chats/:user_id', getUserChats);

// Create or get existing chat between two users for a property
router.post('/start', startChat);

// Get messages for a specific chat
router.get('/:chat_id', getMessages);

// Send a message to a chat (supports both JSON and multipart form data)
router.post('/', upload.array('attachments', 5), sendMessage);

// Mark messages as read in a chat
router.put('/:chat_id/read', markMessagesAsRead);

module.exports = router;
