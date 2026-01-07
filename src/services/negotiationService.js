import { supabase } from "../lib/supabaseClient";

/**
 * Negotiation Service
 * Handles property price haggling and negotiation states
 */
export const NegotiationService = {
  /**
   * Start a new negotiation
   */
  async startNegotiation(negotiationData) {
    try {
      const { data, error } = await supabase
        .from('negotiations')
        .insert([{
          ...negotiationData,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // Fallback for missing table
        if (error.code === '42P01') {
          console.warn('Negotiations table missing, using localStorage fallback');
          const mockNegotiations = JSON.parse(localStorage.getItem('mock_negotiations') || '[]');
          const newNegotiation = { id: Date.now(), ...negotiationData, status: 'pending' };
          mockNegotiations.push(newNegotiation);
          localStorage.setItem('mock_negotiations', JSON.stringify(mockNegotiations));
          return { success: true, data: newNegotiation };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error starting negotiation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user negotiations
   */
  async getUserNegotiations(userId) {
    try {
      const { data, error } = await supabase
        .from('negotiations')
        .select(`
          *,
          property:properties(title, location, price, images)
        `)
        .eq('tenant_id', userId);

      if (error) {
        if (error.code === '42P01') {
           return { success: true, data: JSON.parse(localStorage.getItem('mock_negotiations') || '[]').filter(n => n.tenant_id === userId) };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get negotiations for properties owned by a landlord
   */
  async getLandlordNegotiations(landlordId) {
    try {
      const { data, error } = await supabase
        .from('negotiations')
        .select(`
          *,
          property:properties(title, location, price, images)
        `)
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
           // Fallback for mock data
           const mock = JSON.parse(localStorage.getItem('mock_negotiations') || '[]');
           return { success: true, data: mock.filter(n => n.landlord_id === landlordId) };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching landlord negotiations:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update negotiation status (Accept/Reject/Counter)
   */
  async updateNegotiationStatus(negotiationId, status, responseMessage, counterPrice = null) {
    try {
      const updateData = {
        status,
        landlord_response: responseMessage,
        updated_at: new Date().toISOString()
      };

      if (counterPrice) {
        updateData.counter_price = counterPrice;
      }

      const { data, error } = await supabase
        .from('negotiations')
        .update(updateData)
        .eq('id', negotiationId)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          // Mock update
          const mock = JSON.parse(localStorage.getItem('mock_negotiations') || '[]');
          const index = mock.findIndex(n => n.id === negotiationId || n.id === parseInt(negotiationId));
          if (index !== -1) {
            mock[index] = { ...mock[index], ...updateData };
            localStorage.setItem('mock_negotiations', JSON.stringify(mock));
            return { success: true, data: mock[index] };
          }
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating negotiation:', error);
      return { success: false, error: error.message };
    }
  }
};
