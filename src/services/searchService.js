/**
 * Search service for handling property search functionality
 */

/**
 * Search for properties based on filters
 * @param {Object} filters - Search filters (e.g., location, price range, bedrooms, etc.)
 * @returns {Promise<Array>} - Array of matching properties
 */
const searchProperties = async (filters = {}) => {
  try {
    // This is a mock implementation. In a real app, this would make an API call to your backend
    const response = await fetch('/api/properties/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching properties:', error);
    throw error;
  }
};

/**
 * Get property details by ID
 * @param {string} propertyId - ID of the property to fetch
 * @returns {Promise<Object>} - Property details
 */
const getPropertyById = async (propertyId) => {
  try {
    const response = await fetch(`/api/properties/${propertyId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch property details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching property:', error);
    throw error;
  }
};

export default {
  searchProperties,
  getPropertyById,
};
