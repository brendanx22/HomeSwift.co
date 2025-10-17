// src/pages/LandlordPropertyBrowse.jsx
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
  X,
  Edit,
  Trash2,
  Eye,
  TrendingUp
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PropertyAPI } from '../lib/propertyAPI';

export default function LandlordPropertyBrowse() {
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
  const [priceRange, setPriceRange] = useState([0, 0]); // [0, 0] means no price filter
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'my-properties', 'market-research'

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

  // Reload properties when server-side filters change
  useEffect(() => {
    loadProperties();
  }, [searchQuery, locationFilter, propertyType]);

  const loadProperties = async () => {
    try {
      setLoading(true);

      const filters = {};

      if (searchQuery) filters.search = searchQuery;
      if (locationFilter) filters.location = locationFilter;
      if (propertyType) filters.propertyType = propertyType;

      console.log('🔍 Loading properties with filters:', filters);

      const { success, properties: propertiesData } = await PropertyAPI.getProperties(filters);
      if (success) {
        setProperties(propertiesData);
        console.log('✅ Properties loaded:', propertiesData.length);
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

  // Filter properties based on view mode and filters
  const filteredProperties = properties.filter(property => {
    // View mode filter
    if (viewMode === 'my-properties') {
      return property.landlord_id === user?.id;
    } else if (viewMode === 'market-research') {
      return property.landlord_id !== user?.id;
    }
    // viewMode === 'all' shows everything

    // Price range filter
    const matchesPrice = priceRange[0] === 0 && priceRange[1] === 0 ||
      (property.price !== null && property.price !== undefined && property.price >= priceRange[0] && property.price <= priceRange[1]);

    // Bedrooms/Bathrooms filter
    const matchesBedrooms = !bedrooms || (property.bedrooms !== null && property.bedrooms !== undefined && property.bedrooms >= parseInt(bedrooms));
    const matchesBathrooms = !bathrooms || (property.bathrooms !== null && property.bathrooms !== undefined && property.bathrooms >= parseInt(bathrooms));

    return matchesPrice && matchesBedrooms && matchesBathrooms;
  });

  // Get user's own properties for management
  const myProperties = properties.filter(property => property.landlord_id === user?.id);
  const marketProperties = properties.filter(property => property.landlord_id !== user?.id);

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
                console.log('🔙 Landlord back button clicked');
                navigate('/chat');
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer select-none"
              style={{ zIndex: 10 }}
            >
              <X className="w-5 h-5" />
              <span>Back to Chat</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-[#FF6B35] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All Properties
              </button>
              <button
                onClick={() => setViewMode('my-properties')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'my-properties'
                    ? 'bg-white text-[#FF6B35] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                My Properties ({myProperties.length})
              </button>
              <button
                onClick={() => setViewMode('market-research')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'market-research'
                    ? 'bg-white text-[#FF6B35] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Market Research ({marketProperties.length})
              </button>
            </div>

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
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Properties</p>
                    <p className="text-2xl font-bold text-gray-900">{myProperties.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Properties</p>
                    <p className="text-2xl font-bold text-gray-900">{marketProperties.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredProperties.length} of {properties.length} properties
                {viewMode !== 'all' && (
                  <span className="ml-2 text-sm">
                    ({viewMode === 'my-properties' ? 'My Properties' : 'Market Research'})
                  </span>
                )}
              </p>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property, index) => {
                const isMyProperty = property.landlord_id === user?.id;

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
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="text-gray-400 text-6xl">🏠</div>
                        </div>
                      )}

                      {/* Property Status Badge */}
                      <div className="absolute top-4 left-4">
                        {isMyProperty ? (
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            My Property
                          </span>
                        ) : (
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Market
                          </span>
                        )}
                      </div>

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
                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{property.title || 'Untitled Property'}</h3>
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
                          onClick={() => navigate(`/properties/${property.id}`)}
                          className="flex-1 bg-[#FF6B35] text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
                        >
                          View Details
                        </button>

                        {isMyProperty && (
                          <>
                            <button
                              onClick={() => navigate(`/edit-property/${property.id}`)}
                              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {!isMyProperty && (
                          <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredProperties.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-12 text-center"
              >
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
                <p className="text-gray-600 mb-6">
                  {viewMode === 'my-properties'
                    ? "You haven't listed any properties yet. Click 'List Property' to get started!"
                    : "Try adjusting your search criteria or browse all properties"
                  }
                </p>
                {viewMode === 'my-properties' && (
                  <button
                    onClick={() => navigate('/list-property')}
                    className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: '#FF6B35' }}
                  >
                    List Your First Property
                  </button>
                )}
                {viewMode !== 'my-properties' && (
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
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
