import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Trash2,
  Eye,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const PropertyHistory = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadPropertyHistory();
    }
  }, [isAuthenticated, user?.id]);

  const loadPropertyHistory = async () => {
    try {
      setLoading(true);

      // Mock data for now - in real implementation, this would query property_views table
      const mockHistory = [
        {
          id: 1,
          property_id: 'prop1',
          property_title: 'Modern Apartment in Victoria Island',
          property_location: 'Victoria Island, Lagos',
          property_price: 2500000,
          property_bedrooms: 3,
          property_bathrooms: 2,
          property_area: 120,
          property_images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6'],
          property_listing_type: 'for-rent',
          viewed_at: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          view_duration: 45 // seconds
        },
        {
          id: 2,
          property_id: 'prop2',
          property_title: 'Luxury Villa in Lekki',
          property_location: 'Lekki Phase 1, Lagos',
          property_price: 15000000,
          property_bedrooms: 5,
          property_bathrooms: 4,
          property_area: 350,
          property_images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227'],
          property_listing_type: 'for-sale',
          viewed_at: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          view_duration: 120 // seconds
        },
        {
          id: 3,
          property_id: 'prop3',
          property_title: 'Cozy Studio in Ikeja',
          property_location: 'Ikeja, Lagos',
          property_price: 800000,
          property_bedrooms: 1,
          property_bathrooms: 1,
          property_area: 45,
          property_images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
          property_listing_type: 'for-rent',
          viewed_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          view_duration: 30 // seconds
        }
      ];

      setHistory(mockHistory);
    } catch (error) {
      console.error('Error loading property history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      setHistory([]);
      // In real implementation:
      // await supabase.from('property_views').delete().eq('viewer_id', user.id);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const removeFromHistory = async (propertyId) => {
    try {
      setHistory(prev => prev.filter(item => item.property_id !== propertyId));
      // In real implementation:
      // await supabase.from('property_views').delete().eq('property_id', propertyId).eq('viewer_id', user.id);
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your property history</p>
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Property History</h1>
                <p className="text-gray-600">Properties you've recently viewed</p>
              </div>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-red-600 hover:text-red-800 transition-colors text-sm"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FF6B35]"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Viewing History</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start browsing properties to see your viewing history here.
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Start Browsing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Property Image */}
                <div className="relative h-48">
                  {item.property_images && item.property_images.length > 0 ? (
                    <img
                      src={item.property_images[0]}
                      alt={item.property_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400 text-4xl">🏠</div>
                    </div>
                  )}

                  {/* Property Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.property_listing_type === 'for-rent'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {item.property_listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromHistory(item.property_id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4">
                  {/* Property Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.property_title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{item.property_location}</span>
                  </div>

                  {/* Price */}
                  <div className="text-xl font-bold text-[#FF6B35] mb-3">
                    ₦{item.property_price?.toLocaleString()}
                    {item.property_listing_type === 'for-rent' && (
                      <span className="text-sm text-gray-600">/month</span>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        <span>{item.property_bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        <span>{item.property_bathrooms}</span>
                      </div>
                      {item.property_area && (
                        <div className="flex items-center">
                          <Square className="w-4 h-4 mr-1" />
                          <span>{item.property_area} sq ft</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>Viewed {formatTimeAgo(item.viewed_at)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatDuration(item.view_duration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/properties/${item.property_id}`)}
                        className="flex-1 bg-[#FF6B35] text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                      >
                        View Again
                      </button>
                      <button
                        onClick={() => {
                          // Add to saved properties functionality
                          // This would integrate with the existing save system
                        }}
                        className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* History Insights */}
        {history.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Viewing Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF6B35] mb-1">
                  {history.length}
                </div>
                <div className="text-sm text-gray-600">Properties Viewed</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF6B35] mb-1">
                  {Math.round(history.reduce((sum, item) => sum + item.view_duration, 0) / history.length)}s
                </div>
                <div className="text-sm text-gray-600">Avg. View Time</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF6B35] mb-1">
                  {new Set(history.map(item => item.property_location.split(',')[0])).size}
                </div>
                <div className="text-sm text-gray-600">Areas Explored</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PropertyHistory;
