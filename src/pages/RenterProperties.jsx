import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, DollarSign, Home, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PropertyAPI } from '../lib/propertyAPI';
import { useAuth } from '../contexts/AuthContext';

export default function RenterProperties() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [inquiredProperties, setInquiredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('saved');

  useEffect(() => {
    const loadRenterData = async () => {
      try {
        setLoading(true);
        if (!user?.id) {
          setError('User not authenticated. Please log in.');
          return;
        }

        // Load saved properties
        const { success: savedSuccess, savedProperties: savedData } = await PropertyAPI.getSavedProperties(user.id);
        if (savedSuccess) {
          setSavedProperties(savedData || []);
        }

        // TODO: Load inquired properties when that API is implemented
        setInquiredProperties([]);

      } catch (err) {
        console.error('Error loading renter data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRenterData();
  }, [user]);

  const handleRemoveFromSaved = async (propertyId) => {
    try {
      const { success } = await PropertyAPI.toggleSaveProperty(user.id, propertyId);
      if (success) {
        setSavedProperties(prev => prev.filter(item => item.properties?.id !== propertyId));
      }
    } catch (error) {
      console.error('Error removing from saved:', error);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-4"
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8"
          >
            <img
              src="/images/logo.png"
              alt="HomeSwift"
              className="w-20 h-20 object-cover rounded-2xl shadow-lg"
            />
          </motion.div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-16 h-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full mx-auto"
          />
        </div>
      </motion.div>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Properties</h1>
              <p className="text-gray-600">Properties you're interested in and your rental activity</p>
            </div>
            <button
              onClick={() => navigate('/browse')}
              className="text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Browse Properties
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'saved'
                ? 'bg-[#FF6B35] text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Saved Properties ({savedProperties.length})
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'inquiries'
                ? 'bg-[#FF6B35] text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            My Inquiries ({inquiredProperties.length})
          </button>
        </div>

        {activeTab === 'saved' && (
          <div>
            {savedProperties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-12 text-center"
              >
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Saved Properties</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You haven't saved any properties yet. Start browsing and save properties you're interested in for easy access later.
                </p>
                <button
                  onClick={() => navigate('/browse')}
                  className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  Start Browsing
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((item) => {
                  const property = item.properties;
                  return (
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
                            <Home className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        <button
                          onClick={() => handleRemoveFromSaved(property.id)}
                          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </button>
                      </div>

                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                          {property.title}
                        </h3>

                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{property.location}</span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xl font-bold text-[#FF6B35]">
                            ₦{property.price?.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {property.bedrooms || property.rooms} bed • {property.bathrooms} bath
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/properties/${property.id}`)}
                            className="flex-1 text-center py-2 px-4 bg-[#FF6B35] text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div>
            {inquiredProperties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-12 text-center"
              >
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Inquiries Yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You haven't made any property inquiries yet. Browse properties and contact landlords when you find something you're interested in.
                </p>
                <button
                  onClick={() => navigate('/browse')}
                  className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  Browse Properties
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {inquiredProperties.map((inquiry) => (
                  <motion.div
                    key={inquiry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{inquiry.propertyTitle}</h3>
                        <p className="text-gray-600 text-sm">{inquiry.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="font-medium text-[#FF6B35]">{inquiry.status}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
