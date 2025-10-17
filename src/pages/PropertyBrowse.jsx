// src/pages/PropertyBrowse.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Heart,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Phone,
  Star,
  SlidersHorizontal,
  X
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

  // Search filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  // Initialize with no price filter by default (empty array means no filter)
  const [priceRange, setPriceRange] = useState([0, 0]); // [0, 0] means no price filter
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

  // Reload properties when server-side filters change (search, location, property type)
  useEffect(() => {
    // Only load properties if there's an active search or filter
    const hasActiveFilter = searchQuery || locationFilter || propertyType;
    if (hasActiveFilter) {
      loadProperties();
    } else {
      // Clear properties when no filters are active
      setProperties([]);
      setLoading(false);
    }
  }, [searchQuery, locationFilter, propertyType]);

  // Note: Price range, bedrooms, bathrooms are handled client-side only
  // They don't trigger API calls, just filter existing results

  const loadProperties = async () => {
    try {
      setLoading(true);

      // Build filters from URL params and state
      const filters = {};

      if (searchQuery) filters.search = searchQuery;
      if (locationFilter) filters.location = locationFilter;
      if (propertyType) filters.propertyType = propertyType;

      // Note: Price range, bedrooms, bathrooms are handled client-side only
      // They are not sent to the API

      console.log('🔍 Loading properties with filters:', filters);

      const { success, properties: propertiesData } = await PropertyAPI.getProperties(filters);
      if (success) {
        setProperties(propertiesData);
        console.log('✅ Properties loaded:', propertiesData.length);
        console.log('📋 Properties data:', propertiesData);
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

  // Filter properties (client-side filtering for additional filters not handled by API)
  const filteredProperties = properties.filter(property => {
    // Only apply additional filters not handled by the API
    // (like price range and bedroom/bathroom filters if needed)

    // Price range filter (if not handled by API)
    const matchesPrice = priceRange[0] === 0 && priceRange[1] === 0 ||
      (property.price !== null && property.price !== undefined && property.price >= priceRange[0] && property.price <= priceRange[1]);

    // Bedrooms/Bathrooms (if not handled by API)
    const matchesBedrooms = !bedrooms || (property.bedrooms !== null && property.bedrooms !== undefined && property.bedrooms >= parseInt(bedrooms));
    const matchesBathrooms = !bathrooms || (property.bathrooms !== null && property.bathrooms !== undefined && property.bathrooms >= parseInt(bathrooms));

    return matchesPrice && matchesBedrooms && matchesBathrooms;
  });

  // Debug logging for the property that matches search but fails filter
  if (properties.length === 1 && filteredProperties.length === 0) {
    const debugProperty = properties[0];
    console.log('🔍 Property that matches search but fails filter:', {
      property: debugProperty,
      priceRange,
      bedrooms,
      bathrooms,
      matchesPrice: priceRange[0] === 0 && priceRange[1] === 0 ||
        (debugProperty.price !== null && debugProperty.price !== undefined && debugProperty.price >= priceRange[0] && debugProperty.price <= priceRange[1]),
      matchesBedrooms: !bedrooms || (debugProperty.bedrooms !== null && debugProperty.bedrooms !== undefined && debugProperty.bedrooms >= parseInt(bedrooms)),
      matchesBathrooms: !bathrooms || (debugProperty.bathrooms !== null && debugProperty.bathrooms !== undefined && debugProperty.bathrooms >= parseInt(bathrooms)),
      propertyPrice: debugProperty.price,
      propertyBedrooms: debugProperty.bedrooms,
      propertyBathrooms: debugProperty.bathrooms,
      priceRangeActive: !(priceRange[0] === 0 && priceRange[1] === 0)
    });
  }

  // Debug logging for filtered results
  if (properties.length > 0) {
    console.log('🎯 Filtered results:', {
      totalProperties: properties.length,
      filteredProperties: filteredProperties.length,
      priceRange,
      bedroomsFilter: bedrooms,
      bathroomsFilter: bathrooms,
      priceRangeActive: !(priceRange[0] === 0 && priceRange[1] === 0)
    });
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-4"
      >
        <div className="relative">
          {/* Animated logo */}
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

          {/* Animated spinner */}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Properties</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadProperties}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log('🔙 Back button clicked');
                navigate('/chat');
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer select-none"
              style={{ zIndex: 10 }}
            >
              <X className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Browse Properties</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="w-80 bg-white border-r border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Property name or description"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="City, State"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0] === 0 ? '' : priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1] === 0 ? '' : priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                      <select
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${showFilters ? 'ml-0' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {/* Show search prompt when no filters are active */}
            {(!searchQuery && !locationFilter && !propertyType) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-12 text-center shadow-sm"
              >
                <div className="text-gray-400 text-6xl mb-6">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Search for Properties</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Use the search bar or filters to find properties that match your criteria. Start typing to see available rentals.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Open Filters
                  </button>
                  <button
                    onClick={() => setSearchQuery('apartment')}
                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Show Sample Results
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Search Summary */}
                <div className="mb-6">
                  <p className="text-gray-600">
                    {loading ? 'Searching...' : `Showing ${filteredProperties.length} of ${properties.length} properties`}
                  </p>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property, index) => {
                    console.log('🏠 Rendering property:', index + 1, property.id, property.title);
                    return (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-48">
                          {property.images && property.images.length > 0 ? (
                            <>
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('❌ Image failed to load:', property.images[0]);
                                  console.log('🏠 Property data:', property);
                                  e.target.style.display = 'none';
                                  // Show fallback
                                  const fallback = e.target.parentNode.querySelector('.image-fallback');
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                                onLoad={() => {
                                  console.log('✅ Image loaded successfully:', property.images[0]);
                                }}
                              />
                              <div className="image-fallback absolute inset-0 bg-gray-100 items-center justify-center hidden">
                                <div className="text-gray-400 text-6xl">🏠</div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="text-gray-400 text-6xl">🏠</div>
                            </div>
                          )}
                          <button
                            onClick={() => toggleSaveProperty(property.id)}
                            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                          >
                            {savedProperties.has(property.id) ? (
                              <BookmarkCheck className="w-5 h-5 text-[#FF6B35]" />
                            ) : (
                              <Bookmark className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{property.title || 'Untitled Property'}</h3>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  property.listing_type === 'for-rent' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {property.listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[#FF6B35] font-bold text-lg">₦{property.price?.toLocaleString() || '0'}</span>
                          </div>

                          <div className="flex items-center text-gray-600 mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-sm">{property.location || 'Location not specified'}</span>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Bed className="w-4 h-4 mr-1" />
                                <span>{property.bedrooms || property.rooms || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Bath className="w-4 h-4 mr-1" />
                                <span>{property.bathrooms || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Square className="w-4 h-4 mr-1" />
                                <span>{property.area ? `${property.area} sq ft` : 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                // Track property view
                                if (isAuthenticated && user?.id) {
                                  supabase
                                    .from('property_views')
                                    .upsert(
                                      {
                                        property_id: property.id,
                                        viewer_id: user.id,
                                        viewed_at: new Date().toISOString()
                                      },
                                      {
                                        onConflict: 'property_id,viewer_id'
                                      }
                                    )
                                    .then(() => {
                                      console.log('✅ Property view tracked from browse');
                                      navigate(`/properties/${property.id}`);
                                    })
                                    .catch((error) => {
                                      console.error('❌ Error tracking property view:', error);
                                      navigate(`/properties/${property.id}`);
                                    });
                                } else {
                                  navigate(`/properties/${property.id}`);
                                }
                              }}
                              className="flex-1 bg-[#FF6B35] text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
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
                                  // Start chat with property landlord
                                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/start`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${user.access_token || localStorage.getItem('supabase.auth.token')}`
                                    },
                                    body: JSON.stringify({
                                      userA: user.id, // Current user (renter)
                                      userB: property.landlord_id, // Property landlord
                                      property_id: property.id
                                    })
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || 'Failed to start chat');
                                  }

                                  const { chat_id, existing, message } = await response.json();

                                  if (existing) {
                                    toast.success('Chat already exists - redirecting to conversation');
                                  } else {
                                    toast.success('New chat created with landlord');
                                  }

                                  // Navigate to chat page with the specific chat
                                  navigate(`/chat?chatId=${chat_id}`);
                                } catch (error) {
                                  console.error('Error starting chat:', error);
                                  toast.error(error.message || 'Failed to start chat with landlord');
                                }
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredProperties.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg p-12 text-center"
                  >
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setLocationFilter('');
                        setPropertyType('');
                        setPriceRange([0, 0]);
                        setBedrooms('');
                        setBathrooms('');
                      }}
                      className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      style={{ backgroundColor: '#FF6B35' }}
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
