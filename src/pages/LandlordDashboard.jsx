import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Plus, 
  Home, 
  Building, 
  Users, 
  Calendar, 
  BarChart3, 
  MapPin, 
  User, 
  Settings, 
  LogOut, 
  Phone, 
  MessageSquare, 
  Eye, 
  Edit, 
  Trash2, 
  Clock,
  Bed,
  Bath,
  Square,
  ChevronLeft,
  ChevronRight,
  Upload,
  FolderOpen,
  AlertCircle,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const LandlordDashboard = () => {
  const { user, isAuthenticated, loading: authLoading, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  // State for dashboard
  const [activeTab, setActiveTab] = useState('dashboard');
  const [compactMode, setCompactMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    activeRentals: 0,
    propertiesSold: 0,
    activeLeads: 0,
    inquiries: 0
  });
  
  // Check if user is authenticated and has landlord role
  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading) {
        if (!isAuthenticated) {
          navigate('/landlord/login', {
            state: { from: '/landlord/dashboard' }
          });
          return;
        }

        // Check if user has landlord role - use localStorage for consistency
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userType = storedUser?.user_metadata?.user_type || storedUser?.user_type;
        const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const currentRole = storedRoles.find(r => r.is_primary)?.role || storedRoles[0]?.role || userType || 'renter';

        console.log('Dashboard Auth Check:', { currentRole, userType, storedRoles });

        if (currentRole !== 'landlord') {
          console.log('Not a landlord, redirecting to chat');
          navigate('/chat');
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

      // TODO: Replace with actual data fetching logic
      // For now, we'll use mock data
      setStats({
        totalListings: 12,
        totalViews: 1245,
        activeRentals: 8,
        propertiesSold: 24,
        activeLeads: 5,
        inquiries: 18
      });

      // TODO: Fetch actual properties from database
      // const { data: properties, error } = await supabase
      //   .from('properties')
      //   .select('*')
      //   .eq('landlord_id', user.id);

      // if (properties) {
      //   setStats(prev => ({
      //     ...prev,
      //     totalListings: properties.length,
      //     // Calculate other stats from properties data
      //   }));
      // }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-2 border-primary/10 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-secondary mb-3">Loading Dashboard</h2>
          <p className="text-gray-600 text-lg">Preparing your property management experience...</p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/landlord/login" state={{ from: '/landlord/dashboard' }} />;
  }

  // Dynamic stats data based on actual properties
  const statsData = [
    { 
      title: 'TOTAL LISTINGS', 
      value: stats.totalListings.toString(), 
      trend: '+0% today', 
      trendColor: 'text-green-400', 
      icon: Building 
    },
    { 
      title: 'TOTAL VIEWS', 
      value: stats.totalViews.toLocaleString(), 
      trend: '+0% today', 
      trendColor: 'text-green-400', 
      icon: Eye 
    },
    { 
      title: 'ACTIVE RENTALS', 
      value: stats.activeRentals.toString(), 
      status: '0 Pending', 
      statusColor: 'text-yellow-400', 
      icon: Home 
    },
    { 
      title: 'PROPERTIES SOLD', 
      value: stats.propertiesSold.toString(), 
      trend: '+0% today', 
      trendColor: 'text-green-400', 
      icon: Building 
    },
    { 
      title: 'ACTIVE LEADS', 
      value: stats.activeLeads.toString(), 
      status: '0 new leads today', 
      statusColor: 'text-green-400', 
      icon: Users 
    },
    { 
      title: 'INQUIRIES', 
      value: stats.inquiries.toString(), 
      trend: '+0% today', 
      trendColor: 'text-green-400', 
      icon: MessageSquare 
    }
  ];
  
  // Mock recent properties data
  const recentProperties = [
    {
      id: 1,
      title: 'Modern Apartment',
      location: 'New York, NY',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      beds: 2,
      baths: 2,
      area: 1200
    }
    // Add more mock properties as needed
  ];

  // Mock recent leads data
  const recentLeads = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@example.com',
      time: '2 hours ago',
      message: 'I would like to schedule a viewing for this weekend. Please let me know your availability.',
      phone: '+1 (555) 123-4567',
      avatar: 'NB'
    }
  ];

  // Get user information - first name for sidebar, full name for navbar
  const getUserDisplayName = () => {
    console.log('🔍 User metadata for name extraction:', user?.user_metadata);

    // Check if user metadata exists at all
    if (!user?.user_metadata) {
      console.log('❌ No user metadata found');
      return 'User';
    }

    // Try to use first_name from metadata first
    if (user.user_metadata.first_name) {
      console.log('✅ Using first_name from metadata:', user.user_metadata.first_name);
      return user.user_metadata.first_name;
    }

    // Try to use first word from full_name
    if (user.user_metadata.full_name) {
      const firstName = user.user_metadata.full_name.split(' ')[0];
      console.log('✅ Using first word from full_name:', firstName, 'from:', user.user_metadata.full_name);
      return firstName;
    }

    // Last resort: try to extract from email (only for display, not stored)
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      // Clean up email prefixes like "john.doe" or "john_doe" to "John"
      const cleanName = emailPrefix
        .split(/[._]/)[0]  // Take first part before dot or underscore
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter

      console.log('⚠️ Using email fallback for name:', cleanName, 'from:', emailPrefix);
      return cleanName;
    }

    // Final fallback
    console.log('❌ No name data found, using default');
    return 'User';
  };

  const firstName = getUserDisplayName();
  const fullName = user?.user_metadata?.full_name || firstName; // Full name for navbar
  const userEmail = user?.email || '';
  const userInitials = firstName[0]?.toUpperCase() || 'U';

  const removeProperty = async (propertyId) => {
    // TODO: Implement property deletion logic
    console.log('Removing property:', propertyId);
  };

  // Get recent properties from context with null check
  const getRecentProperties = () => {
    // TODO: Implement property fetching logic
    return recentProperties;
  };

  const recentListings = getRecentProperties();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: '3' },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    // { id: 'locate', label: 'Locate', icon: MapPin }
  ];

  const handleNavigation = (id) => {
    setActiveTab(id);
    if (id === 'properties') {
      navigate('/properties');
    }
    if (id === 'messages') {
      navigate('/messages');
    }
    if (id === 'calendar') {
      // For now, navigate to a placeholder or show a message
      // TODO: Create a Calendar page or link to an external calendar service
      console.log('Calendar navigation clicked - implement calendar page');
      // navigate('/calendar'); // Uncomment when calendar page is created
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-[#2C3E50]';
      case 'pending': return 'bg-[#2C3E50]';
      default: return 'bg-[#2C3E50]';
    }
  }; 

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await removeProperty(propertyId);
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  const formatPropertyAddress = (property) => {
    if (property.location) {
      return `${property.location.city}, ${property.location.state}`;
    }
    return 'Address not specified';
  };

  const formatListedDate = (createdAt) => {
    if (!createdAt) return 'Recently listed';
    
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Listed 1 day ago';
    if (diffDays < 7) return `Listed ${diffDays} days ago`;
    if (diffDays < 14) return 'Listed 1 week ago';
    if (diffDays < 30) return `Listed ${Math.ceil(diffDays / 7)} weeks ago`;
    return `Listed ${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#2C3E50]" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-[#2C3E50]" />}
            </button>

            <h1 className="text-lg sm:text-xl font-bold text-[#FF6B35]">HomeSwift</h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Bar - Hidden on mobile, shown on sm+ screens */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-48 md:w-64"
              />
            </div>

            {/* Mobile Search Button */}
            <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 cursor-pointer hover:text-gray-800" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                3
              </span>
            </div>

            {/* User Profile - Compact on mobile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-medium">{userInitials}</span>
              </div>
              <div className="hidden sm:block text-sm">
                <div className="font-medium text-gray-900">{firstName}</div>
                <div className="text-gray-500 text-xs">Agent ID: #{user?.user_metadata?.agent_id || user?.id?.slice(-5) || '00000'}</div>
              </div>
              {/* Mobile user initials only */}
              <div className="sm:hidden text-sm font-medium text-gray-900">
                {firstName}
              </div>
            </div>

            {/* Add Property Button - Compact on mobile */}
            <button
              onClick={() => navigate('/list-property')}
              className="text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full font-semibold flex items-center space-x-1 sm:space-x-2 transition-colors text-sm sm:text-base"
              style={{ backgroundColor: '#FF6B35' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e85e2f')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6B35')}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add New Property</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-[64px] sm:pt-[76px]">
        {/* Fixed Sidebar - Desktop */}
        <aside className={`hidden lg:block fixed left-0 top-[64px] sm:top-[76px] bottom-0 bg-white border-r border-gray-200 transition-all duration-300 ${compactMode ? 'w-16' : 'w-64'} overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-8">

              <button
                onClick={() => setCompactMode(!compactMode)}
                className="p-1 rounded hover:bg-gray-600 transition-colors text-[#fff]"
              >
                {compactMode ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

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
                        ? 'text-[#fff]'
                        : 'text-[#2C3E50] hover:bg-gray-600 '
                    } ${compactMode ? 'justify-center px-2' : ''}`}
                    style={isActive ? { backgroundColor: '#FF6B35' } : {}}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!compactMode && (
                      <>
                        <span>{item.label}</span>
                        {item.badge && (  
                          <span className="text-[#2C3E50] text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                );
              })}
            </nav>

            <div className="border-t border-gray-600 mt-6 pt-6">
              <nav className="space-y-2">
                <motion.button
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-600 transition-all duration-200 ${
                    compactMode ? 'justify-center px-2' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">{userInitials}</span>
                  </div>
                  {!compactMode && (
                    <>
                      <span>{firstName}</span>
                      <span className="text-xs text-gray-400 ml-auto">{userEmail}</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-600 transition-all duration-200 ${
                    compactMode ? 'justify-center px-2' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  {!compactMode && <span>Settings</span>}
                </motion.button>
                <motion.button
                  onClick={handleLogout}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-600 transition-all duration-200 ${
                    compactMode ? 'justify-center px-2' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  {!compactMode && <span>Log out</span>}
                </motion.button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
            <aside className="fixed left-0 top-[64px] sm:top-[76px] bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => {
                          handleNavigation(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-[#fff]'
                            : 'text-[#2C3E50] hover:bg-gray-100'
                        }`}
                        style={isActive ? { backgroundColor: '#FF6B35' } : {}}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[#2C3E50] text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
                            {item.badge}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </nav>

                <div className="border-t border-gray-200 mt-6 pt-6">
                  <nav className="space-y-2">
                    <motion.button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-100 transition-all duration-200" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{userInitials}</span>
                      </div>
                      <span>{firstName}</span>
                    </motion.button>
                    <motion.button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-100 transition-all duration-200" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span>Settings</span>
                    </motion.button>
                    <motion.button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-100 transition-all duration-200" 
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
          </div>
        )}

        {/* Main Content - Scrollable */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-300 ${
          compactMode ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#2C3E50] mb-2">Welcome Back, {firstName}!</h2>
            <p className="text-gray-600">Here's what happening with your properties today!</p>
          </div>

          {/* Main Dashboard Grid: Stats Grid and Recent Leads side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Stats Grid Section - Left Column */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {statsData.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-transparent border border-[#2C3E50] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {stat.title}
                        </h3>
                        {/* <Icon className="w-5 h-5 text-[#2C3E50]" /> */}
                      </div>
                      <div className="text-5xl font-bold text-[#2C3E50] mb-2">{stat.value}</div>
                      {stat.trend && (
                        <div className={`text-xs ${stat.trendColor}`}>
                          ↑ {stat.trend}
                        </div>
                      )}
                      {stat.status && (
                        <div className={`text-xs ${stat.statusColor}`}>
                          {stat.status}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Recent Leads & Inquiries Section - Right Column */}
            <div className="border-2 border-[#2C3E50] rounded-2xl p-4 sm:p-6 shadow-lg bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <h3 className="text-lg sm:text-2xl font-bold text-[#2C3E50]">Recent Leads & Inquiries</h3>
                  <span className="text-white text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#FF6B35' }}>0 New</span>
                </div>
                <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-1">
                  <span className="hidden sm:inline">View all</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Container for Leads */}
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {recentLeads.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl p-8 text-center flex-1 flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-[#2C3E50] mb-1">No New Leads Just Yet</h4>
                        <p className="text-gray-600 text-sm max-w-xs">
                          Keep your listings active and engaging. Interested renters or buyers will show up here.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  recentLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-transparent border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                          {lead.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#2C3E50] text-sm">{lead.name}</h4>
                              <p className="text-gray-500 text-xs truncate">{lead.email}</p>
                            </div>
                            <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{lead.time}</span>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-[#2C3E50] mb-2">Inquiry</p>
                            <p className="text-gray-600 text-sm leading-relaxed">{lead.message}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 text-[#2C3E50] text-sm">
                              <Phone className="w-4 h-4" />
                              <span>{lead.phone}</span>
                            </div>
                            <button className="px-3 py-1.5 hover:bg-green-700 text-[#2C3E50] font-semibold text-xs rounded-lg transition-colors">
                              Call
                            </button>
                            <button className="px-3 py-1.5  text-[#2C3E50] font-semibold text-xs rounded-lg transition-colors">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* My Recent Listings */}
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#2C3E50] mb-2">
                My Listings {recentListings.length > 0 && `(${recentListings.length})`}
              </h3>
              <p className="text-gray-600">
                {recentListings.length > 0 
                  ? 'Recent Listings are houses that have been uploaded for a week'
                  : 'All your property listings will appear here. Begin by uploading details and images of your house or apartment.'
                }
              </p>
            </div>

            {recentListings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-xl p-12 text-center"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#2C3E50] mb-2">Start by uploading a file</h4>
                    <p className="text-gray-600 max-w-md">
                      All your property listings will appear here. Begin by uploading details and images of your house or apartment.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/list-property')}
                    className="mt-4 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    style={{ backgroundColor: '#FF6B35' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e85e2f')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6B35')}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Your First Property</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <div className="relative h-48">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Building className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(listing.status)}`}>
                          {listing.status || 'Active'}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 bg-[#FF6B35] text-white px-2 py-1 rounded text-xs font-medium">
                        {listing.propertyType || 'Property'}
                      </div>
                      <div className="absolute bottom-4 right-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        {listing.views || 0} Views
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-bold text-[#2C3E50] mb-2">{listing.title}</h4>
                      <p className="text-gray-600 text-sm mb-4">{formatPropertyAddress(listing)}</p>
                      
                      <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Bed className="w-4 h-4" />
                          <span>{listing.rooms || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Bath className="w-4 h-4" />
                          <span>{listing.bathrooms || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-lg font-bold text-[#FF6B35]">
                            ₦{listing.price?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatListedDate(listing.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 px-3 py-2 border border-[#FF6B35] rounded-lg text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                          <span className="text-sm">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteProperty(listing.id)}
                          className="flex items-center space-x-1 px-3 py-2 border border-red-500 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordDashboard;