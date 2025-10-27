const express = require('express');
const verificationController = require('../controllers/verificationController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/verification/user/:userId/start
 * @desc    Start user verification process
 * @access  Private (User)
 */
router.post('/user/:userId/start', authenticateToken, verificationController.startUserVerification);

/**
 * @route   POST /api/verification/user/:userId/documents
 * @desc    Upload verification documents
 * @access  Private (User)
 */
router.post('/user/:userId/documents', authenticateToken, upload.array('files', 5), verificationController.uploadVerificationDocuments);

/**
 * @route   POST /api/verification/user/:userId/process
 * @desc    Process user verification with AI
 * @access  Private (User)
 */
router.post('/user/:userId/process', authenticateToken, upload.single('selfie'), verificationController.processUserVerification);

/**
 * @route   POST /api/verification/property/:propertyId/start
 * @desc    Start property verification process
 * @access  Private (Landlord)
 */
router.post('/property/:propertyId/start', authenticateToken, requireRole(['landlord']), verificationController.startPropertyVerification);

/**
 * @route   POST /api/verification/property/:propertyId/photos
 * @desc    Upload property verification photos
 * @access  Private (Landlord)
 */
router.post('/property/:propertyId/photos', authenticateToken, requireRole(['landlord']), upload.array('files', 10), verificationController.uploadPropertyPhotos);

/**
 * @route   POST /api/verification/property/:propertyId/process
 * @desc    Process property verification with AI
 * @access  Private (Landlord)
 */
router.post('/property/:propertyId/process', authenticateToken, requireRole(['landlord']), verificationController.processPropertyVerification);

/**
 * @route   GET /api/verification/status/:targetType/:targetId
 * @desc    Get verification status for user or property
 * @access  Private
 */
router.get('/status/:targetType/:targetId', authenticateToken, verificationController.getVerificationStatus);

/**
 * @route   GET /api/verification/user/:userId/dashboard
 * @desc    Get user's verification dashboard
 * @access  Private (User)
 */
router.get('/user/:userId/dashboard', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user verification status
    const { data: user } = await require('supabase')
      .from('users')
      .select('email_verified, phone_verified, id_verified, ai_face_score, verification_status, verified_at')
      .eq('id', userId)
      .single();

    // Get user's properties verification status
    const { data: properties } = await require('supabase')
      .from('properties')
      .select('id, title, ai_verification_score, verification_status')
      .eq('user_id', userId);

    // Get recent verification attempts
    const { data: attempts } = await require('supabase')
      .from('verification_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        userVerification: user,
        propertiesVerification: properties || [],
        recentAttempts: attempts || [],
        verificationProgress: calculateVerificationProgress(user, properties)
      }
    });

  } catch (error) {
    console.error('Error in user verification dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load verification dashboard'
    });
  }
});

/**
 * @route   GET /api/verification/admin/attempts
 * @desc    Get all verification attempts (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/attempts', authenticateToken, requireRole(['admin']), verificationController.getAllVerificationAttempts);

/**
 * @route   GET /api/verification/admin/stats
 * @desc    Get verification statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // User verification stats
    const { data: userStats } = await require('supabase')
      .from('users')
      .select('verification_status')
      .in('verification_status', ['verified', 'rejected', 'pending']);

    // Property verification stats
    const { data: propertyStats } = await require('supabase')
      .from('properties')
      .select('verification_status')
      .in('verification_status', ['verified', 'rejected', 'pending']);

    // Recent verification attempts
    const { data: recentAttempts } = await require('supabase')
      .from('verification_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate statistics
    const stats = {
      users: {
        total: (userStats || []).length,
        verified: (userStats || []).filter(u => u.verification_status === 'verified').length,
        pending: (userStats || []).filter(u => u.verification_status === 'pending').length,
        rejected: (userStats || []).filter(u => u.verification_status === 'rejected').length
      },
      properties: {
        total: (propertyStats || []).length,
        verified: (propertyStats || []).filter(p => p.verification_status === 'verified').length,
        pending: (propertyStats || []).filter(p => p.verification_status === 'pending').length,
        rejected: (propertyStats || []).filter(p => p.verification_status === 'rejected').length
      },
      recentAttempts: recentAttempts || []
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error in admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load verification statistics'
    });
  }
});

/**
 * @route   POST /api/verification/admin/override
 * @desc    Manual verification override (Admin only)
 * @access  Private (Admin)
 */
router.post('/admin/override', authenticateToken, requireRole(['admin']), verificationController.manualVerificationOverride);

/**
 * @route   GET /api/verification/admin/logs
 * @desc    Get verification logs (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data: logs, error } = await require('supabase')
      .from('verification_logs')
      .select(`
        *,
        users!verification_logs_user_id_fkey (email, full_name),
        admin:users!verification_logs_admin_id_fkey (email, full_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching verification logs:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch verification logs'
      });
    }

    res.json({
      success: true,
      data: logs || []
    });

  } catch (error) {
    console.error('Error in admin logs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Helper function to calculate verification progress
 */
function calculateVerificationProgress(user, properties) {
  const progress = {
    email: user?.email_verified ? 100 : 0,
    phone: user?.phone_verified ? 100 : 0,
    identity: user?.id_verified ? 100 : 0,
    properties: 0
  };

  if (properties && properties.length > 0) {
    const verifiedProperties = properties.filter(p => p.verification_status === 'verified').length;
    progress.properties = (verifiedProperties / properties.length) * 100;
  }

  const completedSteps = Object.values(progress).filter(score => score === 100).length;
  const overallProgress = (completedSteps / Object.keys(progress).length) * 100;

  return {
    steps: progress,
    overall: Math.round(overallProgress),
    completedSteps,
    totalSteps: Object.keys(progress).length
  };
}

module.exports = router;
