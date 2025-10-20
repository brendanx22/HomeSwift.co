import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Map,
  List,
  Grid3X3,
  Navigation,
  Locate,
  Home,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Waves,
  Trees,
  ShoppingCart,
  GraduationCap,
  Heart,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PropertyAPI } from '../lib/propertyAPI';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Mock map component since we don't have a real map library
const MapView = ({ properties, selectedProperty, onPropertySelect, userLocation }) => {
  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Interactive Map</h3>
          <p className="text-sm text-gray-500 mb-4">
            {properties.length} properties in this area
          </p>
          <div className="text-xs text-gray-400">
            (Map integration would show property locations here)
          </div>
        </div>
      </div>

      {/* Property markers would go here in a real implementation */}
      {properties.slice(0, 5).map((property, index) => (
        <div
          key={property.id}
          className={`absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
            selectedProperty?.id === property.id ? 'ring-4 ring-blue-500' : ''
          }`}
          style={{
            left: `${20 + (index * 15)}%`,
            top: `${30 + (index * 10)}%`
          }}
          onClick={() => onPropertySelect(property)}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            ₦{property.price?.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdvancedSearch = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [amenities, setAmenities] = useState([]);
  const [radius, setRadius] = useState(10); // km

  // Advanced filters
  const [listingType, setListingType] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [parking, setParking] = useState('');
  const [petFriendly, setPetFriendly] = useState('');
  const [furnished, setFurnished] = useState('');

  useEffect(() => {
    loadProperties();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery, locationFilter, propertyType, priceRange, bedrooms, bathrooms, amenities, listingType, yearBuilt, parking, petFriendly, furnished]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const { success, properties: propertiesData } = await PropertyAPI.getProperties();

      if (success) {
        setProperties(propertiesData || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
        }
      );
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(property =>
        property.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Property type
    if (propertyType) {
      filtered = filtered.filter(property =>
        property.property_type === propertyType
      );
    }

    // Price range
    filtered = filtered.filter(property =>
      property.price >= priceRange[0] && property.price <= priceRange[1]
    );

    // Bedrooms
    if (bedrooms) {
      filtered = filtered.filter(property =>
        (property.bedrooms || property.rooms || 0) >= parseInt(bedrooms)
      );
    }

    // Bathrooms
    if (bathrooms) {
      filtered = filtered.filter(property =>
        (property.bathrooms || 0) >= parseInt(bathrooms)
      );
    }

    // Listing type
    if (listingType) {
      filtered = filtered.filter(property =>
        property.listing_type === listingType
      );
    }

    setFilteredProperties(filtered);
  };

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    if (viewMode === 'map') {
      // Scroll to property in grid view
      setViewMode('grid');
    }
  };

  const toggleAmenity = (amenity) => {
    setAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setPropertyType('');
    setPriceRange([0, 50000000]);
    setBedrooms('');
    setBathrooms('');
    setAmenities([]);
    setListingType('');
    setYearBuilt('');
    setParking('');
    setPetFriendly('');
    setFurnished('');
    setRadius(10);
  };

  const amenityOptions = [
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'garden', label: 'Garden', icon: Trees },
    { id: 'shopping', label: 'Near Shopping', icon: ShoppingCart },
    { id: 'schools', label: 'Near Schools', icon: GraduationCap }
  ];

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
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Navigation className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
                <p className="text-gray-600">Find your perfect property with advanced filters and map view</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 ${viewMode === 'map' ? 'bg-gray-100' : ''}`}
                >
                  <Map className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Property name, location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="City, neighborhood..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Search radius: {radius} km
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={radius}
                      onChange={(e) => setRadius(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="duplex">Duplex</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (₦)
                  </label>
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
                      value={priceRange[1] === 50000000 ? '' : priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 50000000])}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
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
                      <option value="5">5+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="space-y-2">
                    {amenityOptions.map((amenity) => (
                      <label key={amenity.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={amenities.includes(amenity.id)}
                          onChange={() => toggleAmenity(amenity.id)}
                          className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <amenity.icon className="w-4 h-4 mr-2" />
                          {amenity.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Listing Type
                    </label>
                    <select
                      value={listingType}
                      onChange={(e) => setListingType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    >
                      <option value="">All</option>
                      <option value="for-rent">For Rent</option>
                      <option value="for-sale">For Sale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Built
                    </label>
                    <select
                      value={yearBuilt}
                      onChange={(e) => setYearBuilt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    >
                      <option value="">Any</option>
                      <option value="2020+">2020 or newer</option>
                      <option value="2010-2020">2010-2020</option>
                      <option value="2000-2010">2000-2010</option>
                      <option value="1990-2000">1990-2000</option>
                      <option value="older">Older than 1990</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={petFriendly === 'yes'}
                        onChange={(e) => setPetFriendly(e.target.checked ? 'yes' : '')}
                        className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pet Friendly</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={furnished === 'yes'}
                        onChange={(e) => setFurnished(e.target.checked ? 'yes' : '')}
                        className="rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Furnished</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredProperties.length} Properties Found
                </h2>
                {filteredProperties.length > 0 && (
                  <p className="text-gray-600 text-sm">
                    Showing results for "{searchQuery || 'all properties'}"
                  </p>
                )}
              </div>

              {userLocation && (
                <button
                  onClick={getUserLocation}
                  className="flex items-center space-x-2 text-[#FF6B35] hover:text-orange-600 transition-colors"
                >
                  <Locate className="w-4 h-4" />
                  <span className="text-sm">Use My Location</span>
                </button>
              )}
            </div>

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="mb-6">
                <MapView
                  properties={filteredProperties}
                  selectedProperty={selectedProperty}
                  onPropertySelect={handlePropertySelect}
                  userLocation={userLocation}
                />
              </div>
            )}

            {/* Properties Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FF6B35]"></div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Properties Found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try adjusting your search criteria or removing some filters to see more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {filteredProperties.map((property) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                    onClick={() => handlePropertySelect(property)}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'}`}>
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

                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          property.listing_type === 'for-rent'
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}>
                          {property.listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
                        </span>
                      </div>

                      <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {property.title}
                      </h3>

                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.location}</span>
                      </div>

                      <div className="text-xl font-bold text-[#FF6B35] mb-3">
                        ₦{property.price?.toLocaleString()}
                        {property.listing_type === 'for-rent' && (
                          <span className="text-sm text-gray-600">/month</span>
                        )}
                      </div>

                      <div className={`flex items-center justify-between text-sm text-gray-600 ${
                        viewMode === 'list' ? 'mb-3' : 'mb-4'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            <span>{property.bedrooms || property.rooms || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            <span>{property.bathrooms || 0}</span>
                          </div>
                          {property.area && (
                            <div className="flex items-center">
                              <Square className="w-4 h-4 mr-1" />
                              <span>{property.area} sq ft</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/properties/${property.id}`);
                        }}
                        className="w-full bg-[#FF6B35] text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdvancedSearch;
