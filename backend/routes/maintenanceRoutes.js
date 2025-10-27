const express = require('express');
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads (photos and attachments)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and documents
    if (file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('document') ||
        file.mimetype.includes('text')) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/maintenance/requests
 * @desc    Create maintenance request
 * @access  Private (Tenant)
 */
router.post('/requests', authenticateToken, upload.array('attachments', 10), maintenanceController.createMaintenanceRequest);

/**
 * @route   GET /api/maintenance/requests
 * @desc    Get maintenance requests for user
 * @access  Private
 */
router.get('/requests', authenticateToken, maintenanceController.getMaintenanceRequests);

/**
 * @route   PUT /api/maintenance/requests/:requestId
 * @desc    Update maintenance request status
 * @access  Private (Landlord/Technician)
 */
router.put('/requests/:requestId', authenticateToken, maintenanceController.updateMaintenanceRequest);

/**
 * @route   GET /api/maintenance/analytics
 * @desc    Get maintenance analytics
 * @access  Private
 */
router.get('/analytics', authenticateToken, maintenanceController.getMaintenanceAnalytics);

/**
 * @route   GET /api/maintenance/contractors
 * @desc    Get available contractors
 * @access  Private
 */
router.get('/contractors', authenticateToken, maintenanceController.getAvailableContractors);

/**
 * @route   GET /api/maintenance/requests/:requestId
 * @desc    Get maintenance request details
 * @access  Private (Request parties)
 */
router.get('/requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const { data: request, error } = await req.supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(*),
        assigned_contractor:maintenance_contractors(*)
      `)
      .eq('id', requestId)
      .single();

    if (error || !request) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance request not found'
      });
    }

    // Verify user has access to this request
    const hasAccess = request.tenant_id === userId ||
                     request.property?.landlord_id === userId ||
                     request.assigned_to === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Error fetching maintenance request details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance request details'
    });
  }
});

module.exports = router;
