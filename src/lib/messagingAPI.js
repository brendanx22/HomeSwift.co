// src/lib/messagingAPI.js
import { supabase } from './supabaseClient';

/**
 * Messaging API for communication between landlords and renters
 */

export class MessagingAPI {
  /**
   * Get all conversations for a user
   */
  static async getConversations(userId) {
    try {
      // Get all inquiries where the user is either landlord or renter
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('inquiries')
        .select(`
          id,
          property_id,
          message,
          created_at,
          status,
          properties (
            id,
            title,
            landlord_id
          )
        `)
        .or(`renter_id.eq.${userId},properties.landlord_id.eq.${userId}`);

      if (inquiriesError) throw inquiriesError;

      // Group inquiries by property and create conversation objects
      const conversationsMap = new Map();

      inquiries?.forEach(inquiry => {
        const propertyId = inquiry.property_id;
        const isLandlord = inquiry.properties?.landlord_id === userId;

        if (!conversationsMap.has(propertyId)) {
          conversationsMap.set(propertyId, {
            id: propertyId,
            property: inquiry.properties,
            participant: {
              id: isLandlord ? inquiry.renter_id : inquiry.properties?.landlord_id,
              name: isLandlord ? 'Renter' : 'Landlord',
              role: isLandlord ? 'renter' : 'landlord'
            },
            lastMessage: {
              content: inquiry.message,
              timestamp: inquiry.created_at,
              sender: isLandlord ? 'renter' : 'landlord'
            },
            unreadCount: 0,
            inquiries: []
          });
        }

        conversationsMap.get(propertyId).inquiries.push(inquiry);
      });

      return { success: true, conversations: Array.from(conversationsMap.values()) };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages for a specific property conversation
   */
  static async getMessages(propertyId, userId) {
    try {
      const { data: inquiries, error } = await supabase
        .from('inquiries')
        .select(`
          id,
          message,
          created_at,
          status,
          contact_info,
          properties (
            id,
            title,
            landlord_id
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Convert inquiries to message format
      const messages = inquiries?.map(inquiry => ({
        id: inquiry.id,
        content: inquiry.message,
        timestamp: inquiry.created_at,
        sender: inquiry.properties?.landlord_id === userId ? 'landlord' : 'renter',
        status: inquiry.status || 'sent',
        contactInfo: inquiry.contact_info
      })) || [];

      return { success: true, messages };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a new inquiry/message
   */
  static async sendInquiry(propertyId, renterId, message, contactInfo = {}) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .insert([{
          property_id: propertyId,
          renter_id: renterId,
          message: message,
          contact_info: contactInfo,
          status: 'sent',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, inquiry: data };
    } catch (error) {
      console.error('Error sending inquiry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update inquiry status
   */
  static async updateInquiryStatus(inquiryId, status) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .update({ status: status })
        .eq('id', inquiryId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, inquiry: data };
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .neq('renter_id', userId) // Exclude messages sent by the user
        .eq('status', 'sent'); // Only count unread messages

      if (error) throw error;
      return { success: true, unreadCount: count || 0 };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark conversation as read
   */
  static async markConversationAsRead(propertyId, userId) {
    try {
      // Update all inquiries for this property that weren't sent by the current user
      const { data, error } = await supabase
        .from('inquiries')
        .update({ status: 'read' })
        .eq('property_id', propertyId)
        .neq('renter_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get property details with landlord info for messaging
   */
  static async getPropertyWithLandlord(propertyId) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          landlord:landlord_id (
            id,
            email,
            user_metadata
          )
        `)
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      return { success: true, property: data };
    } catch (error) {
      console.error('Error fetching property with landlord:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent conversations (for notifications)
   */
  static async getRecentConversations(userId, limit = 5) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          id,
          property_id,
          message,
          created_at,
          status,
          properties (
            id,
            title,
            images
          )
        `)
        .or(`renter_id.eq.${userId},properties.landlord_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Group by property and get latest message for each
      const conversationsMap = new Map();

      data?.forEach(inquiry => {
        const propertyId = inquiry.property_id;
        if (!conversationsMap.has(propertyId)) {
          conversationsMap.set(propertyId, {
            id: propertyId,
            property: inquiry.properties,
            lastMessage: {
              content: inquiry.message,
              timestamp: inquiry.created_at,
              status: inquiry.status
            }
          });
        }
      });

      return { success: true, conversations: Array.from(conversationsMap.values()) };
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      return { success: false, error: error.message };
    }
  }
}
