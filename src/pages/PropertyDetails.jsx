import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyAPI } from '../lib/propertyAPI';
import { Heart, Share2, Phone, MessageCircle, MapPin, Bed, Bath, Square, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        const { success, property: propertyData } = await PropertyAPI.getProperty(id);
        if (success) {
          setProperty(propertyData);

          // Track property view if user is authenticated
          if (isAuthenticated && user?.id) {
            try {
              await supabase
                .from('property_views')
                .upsert(
                  {
                    property_id: id,
                    viewer_id: user.id,
                    viewed_at: new Date().toISOString()
                  },
                  {
                    onConflict: 'property_id,viewer_id'
                  }
                );
              console.log('✅ Property view tracked');
            } catch (error) {
              console.error('❌ Error tracking property view:', error);
            }
          }
        } else {
          setError('Property not found');
        }
      } catch (error) {
        console.error('Error loading property:', error);
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProperty();
    }
  }, [id, isAuthenticated, user?.id]);

  const handleImageNavigation = (direction) => {
    if (!property?.images?.length) return;

    if (direction === 'next') {
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const handleContact = (type) => {
    // TODO: Implement contact functionality
    console.log(`Contact via ${type}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              console.log('🔙 Error back button clicked');
              navigate('/chat');
            }}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <button
            onClick={() => {
              console.log('🔙 Error back button clicked');
              navigate('/chat');
            }}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            Back to Chat
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                console.log('🔙 Property details back button clicked');
                navigate('/chat');
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer select-none"
              style={{ zIndex: 10 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Chat</span>
            </button>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-96 md:h-[500px]">
                {property.images && property.images.length > 0 ? (
                  <>
                    <img
                      src={property.images[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Main image failed to load:', property.images[currentImageIndex]);
                        e.target.style.display = 'none';
                        const fallback = e.target.parentNode.querySelector('.main-image-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('✅ Main image loaded successfully:', property.images[currentImageIndex]);
                      }}
                    />
                    <div className="main-image-fallback absolute inset-0 bg-gray-100 items-center justify-center hidden">
                      <div className="text-gray-400 text-6xl">🏠</div>
                    </div>

                    {/* Navigation Arrows */}
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={() => handleImageNavigation('prev')}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleImageNavigation('next')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {property.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {property.images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-gray-400 text-6xl">🏠</div>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {property.images && property.images.length > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex space-x-2 overflow-x-auto">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex
                            ? 'border-[#FF6B35]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${property.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('❌ Thumbnail image failed to load:', image);
                            e.target.style.display = 'none';
                            const fallback = e.target.parentNode.querySelector('.thumbnail-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log('✅ Thumbnail image loaded:', image);
                          }}
                        />
                        <div className="thumbnail-fallback absolute inset-0 bg-gray-100 items-center justify-center hidden">
                          <div className="text-gray-300 text-2xl">🏠</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Information */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                  <span className="text-lg">{property.location || 'Location not specified'}</span>
                </div>

                <div className="text-3xl font-bold text-[#FF6B35] mb-6">
                  ₦{property.price?.toLocaleString() || '0'}
                </div>
              </div>

              {/* Property Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="flex items-center">
                  <Bed className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">{property.bedrooms || property.rooms || 0}</div>
                    <div className="text-sm text-gray-600">Bedrooms</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Bath className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">{property.bathrooms || 0}</div>
                    <div className="text-sm text-gray-600">Bathrooms</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Square className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">{property.area || 'N/A'}</div>
                    <div className="text-sm text-gray-600">sq ft</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Home className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-semibold text-gray-900">{property.property_type || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Type</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-600 leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-[#FF6B35] rounded-full mr-3"></div>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Contact/Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Agent</h3>

                <div className="space-y-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleContact('call')}
                    className="w-full bg-[#FF6B35] text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call Agent
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleContact('message')}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send Message
                  </motion.button>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-2">Interested in this property?</p>
                  <p>Contact the agent for more information or to schedule a viewing.</p>
                </div>
              </div>

              {/* Property Stats */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property ID:</span>
                    <span className="font-medium">{property.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed:</span>
                    <span className="font-medium">
                      {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{property.status || 'Available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
