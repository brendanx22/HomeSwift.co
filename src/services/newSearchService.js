// Simple search service implementation
export const searchProperties = async (filters = {}) => {
  console.log('Searching with filters:', filters);
  // Mock data for testing
  return [
    { id: 1, title: 'Sample Property 1', price: 250000 },
    { id: 2, title: 'Sample Property 2', price: 350000 },
  ];
};

export const getPropertyById = async (id) => {
  console.log('Getting property by id:', id);
  // Mock data for testing
  return {
    id,
    title: `Property ${id}`,
    price: 250000,
    description: 'This is a sample property description.'
  };
};

export default {
  searchProperties,
  getPropertyById
};
