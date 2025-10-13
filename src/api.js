import { supabase } from './lib/supabaseClient';

export const API = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',

  // Get auth token from Supabase
  async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' };
  },

  // Properties API
  async getProperties() {
    const res = await fetch(`${this.baseUrl}/api/properties`);
    return res.json();
  },

  async getMyProperties() {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/properties/my`, { headers });
    return res.json();
  },

  async getProperty(id) {
    const res = await fetch(`${this.baseUrl}/api/properties/${id}`);
    return res.json();
  },

  async createProperty(payload) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/properties`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateProperty(id, payload) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/properties/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteProperty(id) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/properties/${id}`, {
      method: 'DELETE',
      headers
    });
    return res.json();
  },

  // Messages API
  async getMessages() {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/messages`, { headers });
    return res.json();
  },

  async sendMessage(payload) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // User API
  async getUserProfile() {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/auth/profile`, { headers });
    return res.json();
  },

  async updateUserProfile(payload) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
