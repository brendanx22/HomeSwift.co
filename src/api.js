export const API = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  async getProperties() {
    const res = await fetch(`${this.baseUrl}/api/properties`);
    return res.json();
  },
  async getProperty(id) {
    const res = await fetch(`${this.baseUrl}/api/properties/${id}`);
    return res.json();
  },
  async addProperty(payload) {
    const res = await fetch(`${this.baseUrl}/api/properties`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
