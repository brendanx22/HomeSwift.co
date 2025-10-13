// src/pages/RenterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Heart,
  MapPin,
  Calendar,
  Filter,
  Home,
  Bed,
  Bath,
  Square,
  DollarSign,
  Star,
  Clock,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Phone,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PropertyAPI } from '../lib/propertyAPI';

export default function RenterDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [bedrooms, setBedrooms] = useState('');

  // Check authentication and load data
  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading) {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        // Load dashboard data
        await loadDashboardData();
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, authLoading, navigate]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      // Fetch properties
      const { success: propertiesSuccess, properties: propertiesData } = await PropertyAPI.getProperties();
      if (propertiesSuccess) {
        setProperties(propertiesData);
      }

      // Fetch saved properties for the current user
      const { success: savedSuccess, savedProperties: savedData } = await PropertyAPI.getSavedProperties(user.id);
      if (savedSuccess) {
        setSavedProperties(new Set(savedData.map(item => item.property_id)));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Show loading state
  if (authLoading || loading) {
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

  // Filter properties based on search criteria
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !searchQuery ||
      property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = !locationFilter ||
      property.location?.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      property.location?.state?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];

    const matchesBedrooms = !bedrooms || property.bedrooms === parseInt(bedrooms);

    return matchesSearch && matchesLocation && matchesPrice && matchesBedrooms;
  });

  // Toggle save property
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

  // Navigation items
  const navigationItems = [
    { id: 'browse', label: 'Browse Properties', icon: Home },
    { id: 'saved', label: 'Saved Properties', icon: Heart },
    { id: 'search', label: 'Advanced Search', icon: Search },
    { id: 'history', label: 'Search History', icon: Clock }
  ];

  const handleNavigation = (id) => {
    setActiveTab(id);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user?.user_metadata) return 'User';

    if (user.user_metadata.first_name) return user.user_metadata.first_name;
    if (user.user_metadata.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const firstName = getUserDisplayName();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-[#FF6B35]">HomeSwift</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
              />
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{firstName[0]?.toUpperCase()}</span>
              </div>
              <div className="hidden md:block text-sm">
                <div className="font-medium text-gray-900">{firstName}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-[#FF6B35]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <nav className="space-y-2">
                <motion.button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span>Settings</span>
                </motion.button>
                <motion.button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span>Log out</span>
                </motion.button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, {firstName}!</h2>
              <p className="text-gray-600">Find your perfect home from thousands of listings</p>
            </div>

            {/* Search Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="">Any Price</option>
                    <option value="0-500000">Under ₦500,000</option>
                    <option value="500000-1000000">₦500,000 - ₦1M</option>
                    <option value="1000000-2000000">₦1M - ₦2M</option>
                    <option value="2000000+">Over ₦2M</option>
                  </select>
                </div>

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

                <div className="flex items-end">
                  <button className="w-full bg-[#FF6B35] text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors">
                    <Filter className="w-4 h-4 inline mr-2" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property, index) => (
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
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => toggleSaveProperty(property.id)}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                    >
                      {savedProperties.includes(property.id) ? (
                        <BookmarkCheck className="w-5 h-5 text-[#FF6B35]" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{property.title}</h3>
                      <span className="text-[#FF6B35] font-bold">₦{property.price?.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{property.location?.city}, {property.location?.state}</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Bed className="w-4 h-4 mr-1" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center">
                          <Bath className="w-4 h-4 mr-1" />
                          <span>{property.bathrooms}</span>
                        </div>
                        <div className="flex items-center">
                          <Square className="w-4 h-4 mr-1" />
                          <span>{property.area} sq ft</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-[#FF6B35] text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors">
                        View Details
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-12 text-center"
              >
                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search filters to find more properties</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLocationFilter('');
                    setBedrooms('');
                  }}
                  className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
