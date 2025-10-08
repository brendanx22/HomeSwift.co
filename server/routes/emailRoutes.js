import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail 
} from '../services/emailService.js';

const router = express.Router();

// Rate limiting for email endpoints
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many email requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Test email endpoint (for testing purposes)
router.get('/test-email', emailLimiter, async (req, res) => {
  try {
    console.log('Test email endpoint called');
    const result = await sendVerificationEmail(
      'nwanzebrendan@gmail.com',
      'Test User',
      'https://homeswift.co/verify-email?token=test123'
    );
    console.log('Test email sent successfully:', result);
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      data: result 
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Send verification email
router.post('/send-verification', emailLimiter, async (req, res) => {
  try {
    const { email, name, verificationLink } = req.body;
    
    if (!email || !name || !verificationLink) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: email, name, verificationLink' 
      });
    }

    const result = await sendVerificationEmail(email, name, verificationLink);
    res.json(result);
  } catch (error) {
    console.error('Verification email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send verification email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send welcome email
router.post('/send-welcome', emailLimiter, async (req, res) => {
  try {
    const { email, name, userType, dashboardLink } = req.body;
    
    if (!email || !name || !userType || !dashboardLink) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: email, name, userType, dashboardLink' 
      });
    }

    const result = await sendWelcomeEmail(email, name, userType, dashboardLink);
    res.json(result);
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send welcome email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send password reset email
router.post('/send-password-reset', emailLimiter, async (req, res) => {
  try {
    const { email, name, resetLink } = req.body;
    
    if (!email || !name || !resetLink) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: email, name, resetLink' 
      });
    }

    const result = await sendPasswordResetEmail(email, name, resetLink);
    res.json(result);
  } catch (error) {
    console.error('Password reset email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send password reset email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get email logs (admin only)
router.get('/logs', async (req, res) => {
  try {
    // In a real app, you'd want to add proper authentication/authorization here
    const { data, error } = await req.supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch email logs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
