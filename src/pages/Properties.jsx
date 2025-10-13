import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, MapPin, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { API } from '../api';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const data = await API.getMyProperties(); // Get current user's properties
        setProperties(data.properties || []);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Properties</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/landlord/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-secondary">My Properties</h1>
          </div>
          <button
            onClick={() => navigate('/list-property')}
            className="text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e85e2f')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6B35')}
          >
            <span>+ Add Property</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {properties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-12 text-center"
          >
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary mb-2">No Properties Yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first property listing</p>
            <button
              onClick={() => navigate('/list-property')}
              className="text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e85e2f')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6B35')}
            >
              <span>Add Your First Property</span>
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Building className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-primary text-white px-2 py-1 rounded text-sm font-medium">
                    {property.status || 'Active'}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-secondary mb-2">{property.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.location?.city}, {property.location?.state}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-primary font-bold">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>₦{property.price?.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {property.rooms} bed • {property.bathrooms} bath
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      to={`/properties/${property.id}`}
                      className="flex-1 text-center py-2 px-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      View Details
                    </Link>
                    <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
