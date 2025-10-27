const express = require('express');
const leaseController = require('../controllers/leaseController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/leases
 * @desc    Create new lease agreement
 * @access  Private (Landlord)
 */
router.post('/', authenticateToken, requireRole(['landlord']), leaseController.createLease);

/**
 * @route   GET /api/leases
 * @desc    Get leases for user
 * @access  Private
 */
router.get('/', authenticateToken, leaseController.getLeases);

/**
 * @route   POST /api/leases/:leaseId/sign
 * @desc    Sign lease agreement
 * @access  Private (Lease parties)
 */
router.post('/:leaseId/sign', authenticateToken, leaseController.signLease);

/**
 * @route   GET /api/leases/:leaseId/document
 * @desc    Get lease document
 * @access  Private (Lease parties)
 */
router.get('/:leaseId/document', authenticateToken, leaseController.getLeaseDocument);

/**
 * @route   GET /api/leases/:leaseId/payments
 * @desc    Get lease payments
 * @access  Private (Lease parties)
 */
router.get('/:leaseId/payments', authenticateToken, leaseController.getLeasePayments);

/**
 * @route   POST /api/leases/:leaseId/payments
 * @desc    Record rent payment
 * @access  Private (Landlord)
 */
router.post('/:leaseId/payments', authenticateToken, requireRole(['landlord']), leaseController.recordPayment);

/**
 * @route   PUT /api/leases/:leaseId/terminate
 * @desc    Terminate lease
 * @access  Private (Landlord)
 */
router.put('/:leaseId/terminate', authenticateToken, requireRole(['landlord']), leaseController.terminateLease);

/**
 * @route   GET /api/leases/:leaseId/details
 * @desc    Get detailed lease information
 * @access  Private (Lease parties)
 */
router.get('/:leaseId/details', authenticateToken, async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;

    const { data: lease, error } = await req.supabase
      .from('leases')
      .select(`
        *,
        property:properties(*),
        payments:lease_payments(*),
        violations:lease_violations(*),
        renewals:lease_renewals(*)
      `)
      .eq('id', leaseId)
      .single();

    if (error || !lease) {
      return res.status(404).json({
        success: false,
        error: 'Lease not found'
      });
    }

    // Verify user has access to this lease
    if (lease.tenant_id !== userId && lease.landlord_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: lease
    });

  } catch (error) {
    console.error('Error fetching lease details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lease details'
    });
  }
});

module.exports = router;
