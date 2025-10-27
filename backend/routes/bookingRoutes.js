const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/bookings
 * @desc    Create new booking request
 * @access  Private (Tenant)
 */
router.post('/', authenticateToken, bookingController.createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get bookings for user (tenant or landlord)
 * @access  Private
 */
router.get('/', authenticateToken, bookingController.getBookings);

/**
 * @route   PUT /api/bookings/:bookingId/status
 * @desc    Update booking status (landlord action)
 * @access  Private (Landlord)
 */
router.put('/:bookingId/status', authenticateToken, requireRole(['landlord']), bookingController.updateBookingStatus);

/**
 * @route   GET /api/bookings/calendar
 * @desc    Get booking calendar for landlord
 * @access  Private (Landlord)
 */
router.get('/calendar', authenticateToken, requireRole(['landlord']), bookingController.getBookingCalendar);

/**
 * @route   GET /api/bookings/analytics
 * @desc    Get booking analytics
 * @access  Private
 */
router.get('/analytics', authenticateToken, bookingController.getBookingAnalytics);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking details
 * @access  Private (Booking parties)
 */
router.get('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const { data: booking, error } = await req.supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        tenant:auth.users!bookings_tenant_id_fkey(*),
        landlord:auth.users!bookings_landlord_id_fkey(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify user has access to this booking
    if (booking.tenant_id !== userId && booking.landlord_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking details'
    });
  }
});

module.exports = router;
