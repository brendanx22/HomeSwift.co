import { supabase } from './lib/supabaseClient';

export const API = {
  baseUrl: import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'https://api.homeswift.co',

  // Get auth token from backend (preferred) or Supabase (fallback)
  async getAuthHeaders() {
    try {
      // First try to get backend JWT token from localStorage
      const backendToken = localStorage.getItem('backendToken');

      if (backendToken) {
        console.log('🔐 Using backend token for API call');
        return {
          'Authorization': `Bearer ${backendToken}`,
          'Content-Type': 'application/json'
        };
      }

      // Fallback to Supabase access token
      console.log('🔄 Falling back to Supabase token');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('❌ Supabase session error:', error.message);
        return { 'Content-Type': 'application/json' };
      }

      if (session?.access_token) {
        console.log('✅ Using Supabase token for API call');
        return {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };
      }

      console.warn('⚠️ No authentication tokens available');
      return { 'Content-Type': 'application/json' };

    } catch (error) {
      console.error('❌ Error getting auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  },

  // Properties API
  async getProperties() {
    try {
      const res = await fetch(`${this.baseUrl}/api/properties`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error('❌ API Error in getProperties:', error);
      throw error;
    }
  },

  async getMyProperties() {
    try {
      const headers = await this.getAuthHeaders();
      console.log('🔍 Calling getMyProperties with baseUrl:', this.baseUrl);

      const res = await fetch(`${this.baseUrl}/api/properties/my`, {
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in getMyProperties:', error);
      throw error;
    }
  },

  // Properties API
  async getProperties() {
    try {
      const res = await fetch(`${this.baseUrl}/api/properties`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error('❌ API Error in getProperties:', error);
      throw error;
    }
  },

  async getMyProperties() {
    try {
      const headers = await this.getAuthHeaders();
      console.log('🔍 Calling getMyProperties with baseUrl:', this.baseUrl);

      const res = await fetch(`${this.baseUrl}/api/properties/my`, {
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in getMyProperties:', error);
      throw error;
    }
  },

  async getProperty(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/properties/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error('❌ API Error in getProperty:', error);
      throw error;
    }
  },

  async createProperty(payload) {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/properties`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in createProperty:', error);
      throw error;
    }
  },

  async updateProperty(id, payload) {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/properties/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in updateProperty:', error);
      throw error;
    }
  },

  async deleteProperty(id) {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/properties/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in deleteProperty:', error);
      throw error;
    }
  },

  // Messages API
  async getMessages() {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/messages`, { headers });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in getMessages:', error);
      throw error;
    }
  },

  async sendMessage(payload) {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in sendMessage:', error);
      throw error;
    }
  },

  // User API
  async getUserProfile() {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/auth/profile`, { headers });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in getUserProfile:', error);
      throw error;
    }
  },

  async updateUserProfile(payload) {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${this.baseUrl}/api/auth/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('❌ API Error in updateUserProfile:', error);
      throw error;
    }
  }
};
