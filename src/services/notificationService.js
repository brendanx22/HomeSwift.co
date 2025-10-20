/**
 * Notification service for creating and managing notifications
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Create a notification for a user
 * @param {string} userId - The user ID to send notification to
 * @param {string} type - Notification type (property_alert, inquiry_response, etc.)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} actionUrl - Optional URL to navigate to when clicked
 * @param {string} actionLabel - Optional label for the action button
 * @param {object} data - Optional additional data
 * @returns {Promise<string>} - The notification ID
 */
export const createNotification = async (
  userId,
  type,
  title,
  message,
  actionUrl = null,
  actionLabel = null,
  data = null
) => {
  try {
    const { data: result, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_action_url: actionUrl,
      p_action_label: actionLabel,
      p_data: data
    });

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create a property alert notification for a renter
 * @param {string} userId - The user ID
 * @param {number} propertyCount - Number of matching properties
 * @param {string} location - Location of properties
 * @returns {Promise<string>} - The notification ID
 */
export const createPropertyAlertNotification = async (userId, propertyCount, location) => {
  return createNotification(
    userId,
    'property_alert',
    'New Property Match',
    `${propertyCount} new ${propertyCount === 1 ? 'property' : 'properties'} match${propertyCount === 1 ? 'es' : ''} your saved search criteria in ${location}`,
    '/browse',
    'View Properties'
  );
};

/**
 * Create an inquiry response notification
 * @param {string} userId - The user ID (inquirer)
 * @param {string} propertyTitle - Title of the property inquired about
 * @returns {Promise<string>} - The notification ID
 */
export const createInquiryResponseNotification = async (userId, propertyTitle) => {
  return createNotification(
    userId,
    'inquiry_response',
    'Inquiry Response',
    `Landlord responded to your inquiry about "${propertyTitle}"`,
    '/chat',
    'View Chat'
  );
};

/**
 * Create a property viewed notification for landlord
 * @param {string} landlordId - The landlord's user ID
 * @param {string} propertyTitle - Title of the viewed property
 * @returns {Promise<string>} - The notification ID
 */
export const createPropertyViewedNotification = async (landlordId, propertyTitle) => {
  return createNotification(
    landlordId,
    'property_viewed',
    'Property Viewed',
    `Someone viewed your property "${propertyTitle}"`,
    '/landlord/dashboard',
    'View Analytics'
  );
};

/**
 * Create a new inquiry notification for landlord
 * @param {string} landlordId - The landlord's user ID
 * @param {string} propertyTitle - Title of the property with new inquiry
 * @returns {Promise<string>} - The notification ID
 */
export const createNewInquiryNotification = async (landlordId, propertyTitle) => {
  return createNotification(
    landlordId,
    'new_inquiry',
    'New Inquiry Received',
    `You have a new inquiry about "${propertyTitle}"`,
    '/inquiries',
    'View Inquiries'
  );
};

/**
 * Create a booking confirmation notification
 * @param {string} userId - The user ID
 * @param {string} propertyTitle - Title of the booked property
 * @returns {Promise<string>} - The notification ID
 */
export const createBookingConfirmationNotification = async (userId, propertyTitle) => {
  return createNotification(
    userId,
    'booking_confirmed',
    'Booking Confirmed',
    `Your booking for "${propertyTitle}" has been confirmed`,
    '/properties',
    'View Bookings'
  );
};

/**
 * Create a payment received notification for landlord
 * @param {string} landlordId - The landlord's user ID
 * @param {number} amount - Payment amount
 * @param {string} tenantName - Name of the tenant
 * @returns {Promise<string>} - The notification ID
 */
export const createPaymentReceivedNotification = async (landlordId, amount, tenantName) => {
  return createNotification(
    landlordId,
    'payment_received',
    'Payment Received',
    `${tenantName} paid ₦${amount.toLocaleString()} for rent`,
    '/landlord/dashboard',
    'View Payments'
  );
};

/**
 * Create a system announcement notification
 * @param {string} userId - The user ID
 * @param {string} title - Announcement title
 * @param {string} message - Announcement message
 * @returns {Promise<string>} - The notification ID
 */
export const createSystemAnnouncementNotification = async (userId, title, message) => {
  return createNotification(
    userId,
    'system_announcement',
    title,
    message,
    null,
    null,
    { priority: 'normal' }
  );
};

/**
 * Create a maintenance reminder notification
 * @param {string} landlordId - The landlord's user ID
 * @param {string} propertyTitle - Title of the property needing maintenance
 * @returns {Promise<string>} - The notification ID
 */
export const createMaintenanceReminderNotification = async (landlordId, propertyTitle) => {
  return createNotification(
    landlordId,
    'maintenance_reminder',
    'Maintenance Reminder',
    `"${propertyTitle}" is due for routine maintenance`,
    '/manage',
    'Schedule Maintenance'
  );
};

/**
 * Create a lease expiration notification
 * @param {string} landlordId - The landlord's user ID
 * @param {string} propertyTitle - Title of the property with expiring lease
 * @param {number} daysUntilExpiry - Days until lease expires
 * @returns {Promise<string>} - The notification ID
 */
export const createLeaseExpirationNotification = async (landlordId, propertyTitle, daysUntilExpiry) => {
  return createNotification(
    landlordId,
    'lease_expiring',
    'Lease Expiring Soon',
    `Lease for "${propertyTitle}" expires in ${daysUntilExpiry} days`,
    '/manage',
    'View Lease Details'
  );
};

/**
 * Create a property listing expiration notification
 * @param {string} landlordId - The landlord's user ID
 * @param {string} propertyTitle - Title of the property with expiring listing
 * @param {number} daysUntilExpiry - Days until listing expires
 * @returns {Promise<string>} - The notification ID
 */
export const createListingExpirationNotification = async (landlordId, propertyTitle, daysUntilExpiry) => {
  return createNotification(
    landlordId,
    'listing_expiring',
    'Listing Expiring Soon',
    `Your listing for "${propertyTitle}" expires in ${daysUntilExpiry} days`,
    '/landlord-properties',
    'Renew Listing'
  );
};

export default {
  createNotification,
  createPropertyAlertNotification,
  createInquiryResponseNotification,
  createPropertyViewedNotification,
  createNewInquiryNotification,
  createBookingConfirmationNotification,
  createPaymentReceivedNotification,
  createSystemAnnouncementNotification,
  createMaintenanceReminderNotification,
  createLeaseExpirationNotification,
  createListingExpirationNotification
};
