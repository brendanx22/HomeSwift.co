import express from 'express';
import { signUp, signIn, signOut, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/signup', signUp);
router.post('/signin', signIn);

// Protected routes
router.post('/signout', authenticateToken, signOut);
router.get('/me', authenticateToken, getCurrentUser);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

export default router;
