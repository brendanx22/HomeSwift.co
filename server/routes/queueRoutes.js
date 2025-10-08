import { Router } from 'express';
import { emailQueue } from '../services/emailQueue.js';

const router = Router();

// Simple queue status endpoint
router.get('/status', (req, res) => {
  emailQueue.checkHealth()
    .then((health) => {
      res.json({
        status: 'ok',
        queue: 'email',
        isRunning: true,
        waiting: health.waiting || 0,
        active: health.active || 0,
        succeeded: health.succeeded || 0,
        failed: health.failed || 0,
        timestamp: new Date().toISOString()
      });
    })
    .catch((error) => {
      console.error('Error checking queue health:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check queue status',
        error: error.message
      });
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    queue: 'email',
    timestamp: new Date().toISOString() 
  });
});

export default router;
