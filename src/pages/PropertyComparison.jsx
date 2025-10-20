import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Home,
  Star,
  ArrowLeft,
  Trash2,
  ExternalLink,
  Share2,
  Heart,
  Plus
} from 'lucide-react';
import { PropertyAPI } from '../lib/propertyAPI';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function PropertyComparison() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get property IDs from URL params or state
  const propertyIds = location.state?.propertyIds || [];

  useEffect(() => {
    if (propertyIds.length > 0) {
      loadPropertiesForComparison();
    } else {
      // If no properties selected, redirect to browse
      navigate('/browse');
    }
  }, [propertyIds]);

  const loadPropertiesForComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all selected properties
      const propertyPromises = propertyIds.map(id => PropertyAPI.getProperty(id));
      const results = await Promise.all(propertyPromises);

      const validProperties = results
        .filter(result => result.success)
        .map(result => result.property);

      if (validProperties.length === 0) {
        setError('No valid properties found for comparison');
        return;
      }

      setProperties(validProperties);
    } catch (error) {
      console.error('Error loading properties for comparison:', error);
      setError('Failed to load properties for comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProperty = (propertyId) => {
    const newProperties = properties.filter(p => p.id !== propertyId);
    setProperties(newProperties);

    // Update URL state
    const newIds = newProperties.map(p => p.id);
    window.history.replaceState({ propertyIds: newIds }, '', location.pathname);

    if (newProperties.length === 0) {
      navigate('/browse');
    }
  };

  const handleAddMoreProperties = () => {
    navigate('/browse', {
      state: {
        returnToComparison: true,
        existingIds: properties.map(p => p.id)
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35]"></div>
      </div>
    );
  }

  if (error || properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'No properties to compare'}</p>
          <button
            onClick={() => navigate('/browse')}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/browse')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Browse</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Comparison</h1>
                <p className="text-gray-600">Compare {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAddMoreProperties}
                className="flex items-center space-x-2 text-[#FF6B35] hover:text-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add More</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  {properties.map((property) => (
                    <th key={property.id} className="px-6 py-4 text-center">
                      <div className="relative">
                        <button
                          onClick={() => handleRemoveProperty(property.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="w-32 h-24 mx-auto mb-2 bg-gray-200 rounded-lg overflow-hidden">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {property.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {property.location}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Price */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Price
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-bold text-[#FF6B35]">
                        ₦{property.price?.toLocaleString()}
                      </div>
                      {property.listing_type === 'for-rent' && (
                        <div className="text-xs text-gray-500">/month</div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Property Type */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Type
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.listing_type === 'for-rent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {property.listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Bedrooms */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Bedrooms
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <Bed className="w-4 h-4 text-gray-400 mr-1" />
                        <span>{property.bedrooms || property.rooms || 0}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Bathrooms */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Bathrooms
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <Bath className="w-4 h-4 text-gray-400 mr-1" />
                        <span>{property.bathrooms || 0}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Area */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Area
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-center">
                      {property.area ? (
                        <div className="flex items-center justify-center">
                          <Square className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{property.area} sq ft</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Property Type */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Property Type
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {property.property_type || 'N/A'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Actions
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => navigate(`/properties/${property.id}`)}
                          className="w-full flex items-center justify-center space-x-1 text-[#FF6B35] hover:text-orange-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm">View Details</span>
                        </button>
                        {isAuthenticated && (
                          <button className="w-full flex items-center justify-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">Save</span>
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Property {property.id.slice(-4)}</h3>
                <button
                  onClick={() => handleRemoveProperty(property.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">₦{property.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bedrooms:</span>
                  <span>{property.bedrooms || property.rooms || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bathrooms:</span>
                  <span>{property.bathrooms || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span>{property.area || 'N/A'} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{property.property_type || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="flex-1 bg-[#FF6B35] text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  View Details
                </button>
                {isAuthenticated && (
                  <button className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Save
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
