// src/pages/PropertyBrowse.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  SlidersHorizontal,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PropertyAPI } from '../lib/propertyAPI';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function PropertyBrowse() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedProperties, setSavedProperties] = useState(new Set());

  // Current property index for swipe navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  // Search filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load properties and saved properties
  useEffect(() => {
    loadProperties();
    if (isAuthenticated && user?.id) {
      loadSavedProperties();
    }
  }, [isAuthenticated, user?.id]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (locationFilter) params.set('location', locationFilter);
    if (propertyType) params.set('type', propertyType);
    setSearchParams(params);
  }, [searchQuery, locationFilter, propertyType, setSearchParams]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchQuery) filters.search = searchQuery;
      if (locationFilter) filters.location = locationFilter;
      if (propertyType) filters.propertyType = propertyType;

      const { success, properties: propertiesData } = await PropertyAPI.getProperties(filters);
      if (success) {
        setProperties(propertiesData);
        setCurrentIndex(0); // Reset to first property when loading new results
      } else {
        setError('Failed to load properties');
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedProperties = async () => {
    try {
      const { success, savedProperties: savedData } = await PropertyAPI.getSavedProperties(user.id);
      if (success) {
        setSavedProperties(new Set(savedData.map(item => item.property_id)));
      }
    } catch (error) {
      console.error('Error loading saved properties:', error);
    }
  };

  const toggleSaveProperty = async (propertyId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const { success, action } = await PropertyAPI.toggleSaveProperty(user.id, propertyId);
      if (success) {
        if (action === 'added') {
          setSavedProperties(prev => new Set([...prev, propertyId]));
        } else {
          setSavedProperties(prev => {
            const newSet = new Set(prev);
            newSet.delete(propertyId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error toggling save property:', error);
    }
  };

  // Touch handlers for swipe detection
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe && currentIndex < properties.length - 1) {
      // Swipe up - next property
      handleNext();
    } else if (isDownSwipe && currentIndex > 0) {
      // Swipe down - previous property
      handlePrevious();
    }
  };

  const handleNext = () => {
    if (currentIndex < properties.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesPrice = priceRange[0] === 0 && priceRange[1] === 0 ||
      (property.price >= priceRange[0] && property.price <= priceRange[1]);
    const matchesBedrooms = !bedrooms || (property.bedrooms >= parseInt(bedrooms));
    const matchesBathrooms = !bathrooms || (property.bathrooms >= parseInt(bathrooms));
    return matchesPrice && matchesBedrooms && matchesBathrooms;
  });

  const currentProperty = filteredProperties[currentIndex];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gray-50"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full"
        />
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Properties</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadProperties}
            className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Browse Properties</h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Sidebar */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:absolute lg:inset-auto lg:top-0 lg:right-0 lg:w-80 lg:z-30">
          <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl lg:relative lg:shadow-none lg:h-auto lg:bg-transparent">
            <div className="p-6 lg:p-0">
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Property name or description"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0] === 0 ? '' : priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1] === 0 ? '' : priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                    <select
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full Screen Property View */}
      <div className="flex-1 relative">
        {/* Show search prompt when no filters are active */}
        {(!searchQuery && !locationFilter && !propertyType && filteredProperties.length === 0) ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4"
          >
            <div className="text-gray-400 text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Search for Properties</h2>
            <p className="text-gray-600 mb-8 max-w-md text-center">
              Use the search bar or filters to find properties that match your criteria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
              >
                <SlidersHorizontal className="w-5 h-5 inline mr-2" />
                Open Filters
              </button>
              <button
                onClick={() => setSearchQuery('apartment')}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                Show Sample Results
              </button>
            </div>
          </motion.div>
        ) : filteredProperties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4"
          >
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6 text-center">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('');
                setPropertyType('');
                setPriceRange([0, 0]);
                setBedrooms('');
                setBathrooms('');
              }}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
            >
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          <div className="relative h-[calc(100vh-80px)] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '-100%' }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 flex flex-col"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Property Image Section */}
                <div className="flex-1 relative">
                  {currentProperty?.images && currentProperty.images.length > 0 ? (
                    <img
                      src={currentProperty.images[0]}
                      alt={currentProperty.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400 text-6xl">🏠</div>
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={() => toggleSaveProperty(currentProperty.id)}
                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    {savedProperties.has(currentProperty.id) ? (
                      <BookmarkCheck className="w-6 h-6 text-[#FF6B35]" />
                    ) : (
                      <Bookmark className="w-6 h-6 text-gray-600" />
                    )}
                  </button>

                  {/* Property Type Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentProperty.listing_type === 'for-rent'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {currentProperty.listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
                    </span>
                  </div>
                </div>

                {/* Property Details Section */}
                <div className="bg-white p-6 shadow-lg">
                  <div className="max-w-7xl mx-auto">
                    <div className="mb-4">
                      <h2 className="font-bold text-gray-900 text-2xl mb-2">
                        {currentProperty.title || 'Untitled Property'}
                      </h2>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span>{currentProperty.location || 'Location not specified'}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-[#FF6B35]">
                        ₦{currentProperty.price?.toLocaleString() || '0'}
                      </span>
                      {currentProperty.listing_type === 'for-rent' && (
                        <span className="text-gray-600 text-lg ml-2">/month</span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex items-center justify-between mb-6 text-gray-600">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                          <Bed className="w-5 h-5 mr-2" />
                          <span className="font-medium">{currentProperty.bedrooms || currentProperty.rooms || 0} beds</span>
                        </div>
                        <div className="flex items-center">
                          <Bath className="w-5 h-5 mr-2" />
                          <span className="font-medium">{currentProperty.bathrooms || 0} baths</span>
                        </div>
                        {currentProperty.area && (
                          <div className="flex items-center">
                            <Square className="w-5 h-5 mr-2" />
                            <span className="font-medium">{currentProperty.area} sq ft</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          if (isAuthenticated && user?.id) {
                            supabase.from('property_views').upsert({
                              property_id: currentProperty.id,
                              viewer_id: user.id,
                              viewed_at: new Date().toISOString()
                            }, { onConflict: 'property_id,viewer_id' });
                          }
                          navigate(`/properties/${currentProperty.id}`);
                        }}
                        className="flex-1 bg-[#FF6B35] text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                      >
                        View Details
                      </button>
                      <button
                        onClick={async () => {
                          if (!isAuthenticated) {
                            toast.error('Please sign in to contact the landlord');
                            return;
                          }

                          try {
                            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/start`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.access_token || localStorage.getItem('supabase.auth.token')}`
                              },
                              body: JSON.stringify({
                                userA: user.id,
                                userB: currentProperty.landlord_id,
                                property_id: currentProperty.id
                              })
                            });

                            if (!response.ok) throw new Error('Failed to start chat');
                            const { chat_id } = await response.json();
                            navigate(`/chat?chatId=${chat_id}`);
                          } catch (error) {
                            toast.error('Failed to start chat with landlord');
                          }
                        }}
                        className="p-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
