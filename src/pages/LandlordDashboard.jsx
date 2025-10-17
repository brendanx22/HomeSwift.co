import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
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
import ProfilePopup from '../components/ProfilePopup';

const LandlordDashboard = () => {
  const { user, isAuthenticated, loading: authLoading, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  // All hooks must be at the top, before any conditional logic
  // State for dashboard
  const [activeTab, setActiveTab] = useState('dashboard');
  const [compactMode, setCompactMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    activeRentals: 0,
    propertiesSold: 0,
    activeLeads: 0,
    inquiries: 0
  });

  // Load user avatar from database
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // console.error('Error loading user avatar:', error);
          return;
        }

        // console.log('🔍 LandlordDashboard - Loading avatar:', data?.avatar_url || 'no avatar');
        setUserAvatar(data?.avatar_url || null);
      } catch (err) {
        // console.error('Error loading user avatar:', err);
        setUserAvatar(null);
      }
    };

    loadUserAvatar();
  }, [user]);
  
  // State for recent data - must be before any conditional logic
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  
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

        // console.log('Dashboard Auth Check:', { currentRole, userType, storedRoles });

        if (currentRole !== 'landlord') {
          // console.log('Not a landlord, redirecting to chat');
          navigate('/chat');
          return;
        }

        // Load dashboard data
        await loadDashboardData();
        await loadRecentData();
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, authLoading, navigate]);
  
  // Load recent properties and leads
  const loadRecentData = async () => {
    try {
      if (!user?.id) return;

      // Fetch recent properties (last 5)
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (propertiesError) {
        console.error('Error fetching recent properties:', propertiesError);
      } else {
        setRecentProperties(properties || []);
        // console.log('🏠 Recent properties loaded:', properties?.length || 0);
        // console.log('📋 Recent properties data:', properties);
      }

      // Fetch property views for these properties
      if (properties && properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        const { data: viewsData, error: viewsError } = await supabase
          .from('property_views')
          .select('property_id')
          .in('property_id', propertyIds);

        if (viewsError) {
          // console.error('Error fetching property views:', viewsError);
        } else {
          // Count views per property
          const viewsByProperty = {};
          viewsData?.forEach(view => {
            viewsByProperty[view.property_id] = (viewsByProperty[view.property_id] || 0) + 1;
          });

          // Update properties with view counts
          const propertiesWithViews = properties.map(property => ({
            ...property,
            views: viewsByProperty[property.id] || 0
          }));

          setRecentProperties(propertiesWithViews);
        }
      }

      // Fetch recent inquiries (last 5)
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (inquiriesError) {
        // console.error('Error fetching recent inquiries:', inquiriesError);
      } else {
        // Transform inquiries data to match expected format
        const transformedLeads = inquiries?.map(inquiry => ({
          id: inquiry.id,
          name: 'Potential Tenant', // Since we don't have renter info in inquiries table yet
          email: 'inquiry@example.com', // Placeholder - would need to join with user_profiles
          time: formatTimeAgo(inquiry.created_at),
          message: inquiry.message,
          phone: '+1 (555) 123-4567', // Placeholder
          avatar: 'PT' // Placeholder initials
        })) || [];

        setRecentLeads(transformedLeads);
        // console.log('💬 Recent leads loaded:', transformedLeads?.length || 0);
      }

    } catch (error) {
      // console.error('❌ Error loading recent data:', error);
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      // console.log('🔍 Loading dashboard data for user:', user.id);

      // Fetch actual properties from database
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user.id);

      if (propertiesError) {
        // console.error('Error fetching properties:', propertiesError);
        throw propertiesError;
      }

      // console.log('✅ Properties fetched:', properties?.length || 0);
      // console.log('📋 Properties data:', properties);

      // Calculate stats from properties data
      const totalProperties = properties?.length || 0;
      const featuredProperties = properties?.filter(p => p.is_featured).length || 0;

      // Fetch inquiries for this landlord
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('*')
        .eq('landlord_id', user.id);

      if (inquiriesError) {
        // console.error('Error fetching inquiries:', inquiriesError);
      }

      // Fetch property views for this landlord's properties
      let totalViews = 0;
      if (properties && properties.length > 0) {
        const { data: viewsData, error: viewsError } = await supabase
          .from('property_views')
          .select('property_id')
          .in('property_id', properties.map(p => p.id));

        if (viewsError) {
          // console.error('Error fetching property views:', viewsError);
        } else {
          totalViews = viewsData?.length || 0;
          // console.log('✅ Property views fetched:', totalViews);
        }
      } else {
        // console.log('ℹ️ No properties found, skipping property views query');
      }

      // Calculate total inquiries from real data
      const totalInquiries = inquiries?.length || 0;

      // Update stats with real data
      setStats({
        totalListings: totalProperties,
        totalViews: totalViews, // Use real view data
        activeRentals: Math.floor(totalProperties * 0.7), // Mock calculation
        propertiesSold: Math.floor(totalProperties * 0.3), // Mock calculation
        activeLeads: totalInquiries,
        inquiries: totalInquiries
      });

      // console.log('📊 Dashboard stats updated:', {
      //   totalListings: totalProperties,
      //   totalInquiries: totalInquiries,
      //   featuredProperties: totalProperties
      // });

    } catch (error) {
      // console.error('❌ Error loading dashboard data:', error);
      // Fallback to mock data on error
      setStats({
        totalListings: 0,
        totalViews: 0,
        activeRentals: 0,
        propertiesSold: 0,
        activeLeads: 0,
        inquiries: 0
      });
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
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/landlord/login" state={{ from: '/landlord/dashboard' }} />;
  }

  // Get user information - first name for sidebar, full name for navbar
  const getUserDisplayName = () => {
    // console.log('🔍 User metadata for name extraction:', user?.user_metadata);

    // Check if user metadata exists at all
    if (!user?.user_metadata) {
      // console.log('❌ No user metadata found');
      return 'User';
    }

    // Try to use first_name from metadata first
    if (user.user_metadata.first_name) {
      // console.log('✅ Using first_name from metadata:', user.user_metadata.first_name);
      return user.user_metadata.first_name;
    }

    // Try to use first word from full_name
    if (user.user_metadata.full_name) {
      const firstName = user.user_metadata.full_name.split(' ')[0];
      // console.log('✅ Using first word from full_name:', firstName, 'from:', user.user_metadata.full_name);
      return firstName;
    }

    // Last resort: try to extract from email (only for display, not stored)
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      // Clean up email prefixes like "john.doe" or "john_doe" to "John"
      const cleanName = emailPrefix
        .split(/[._]/)[0]  // Take first part before dot or underscore
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter

      // console.log('⚠️ Using email fallback for name:', cleanName, 'from:', emailPrefix);
      return cleanName;
    }

    // Final fallback
    // console.log('❌ No name data found, using default');
    return 'User';
  };

  const firstName = getUserDisplayName();
  const fullName = user?.user_metadata?.full_name || firstName; // Full name for navbar
  const userEmail = user?.email || '';
  const userInitials = firstName[0]?.toUpperCase() || 'U';

  const removeProperty = async (propertyId) => {
    try {
      // console.log('🗑️ Deleting property:', propertyId);

      // Delete from Supabase database
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('landlord_id', user.id); // Ensure only landlord can delete their own properties

      if (error) {
        // console.error('❌ Error deleting property:', error);
        throw error;
      }

      // console.log('✅ Property deleted successfully from database');

      // Refresh dashboard data to show updated listings
      await loadDashboardData();
      await loadRecentData();

    } catch (error) {
      // console.error('❌ Failed to delete property:', error);
      throw error;
    }
  };

  // Get recent properties from database
  const getRecentProperties = () => {
    return recentProperties;
  };

  const recentListings = getRecentProperties();

  // Dynamic stats data based on actual database data
  const statsData = [
    {
      title: 'TOTAL LISTINGS',
      value: stats.totalListings.toString(),
      trend: stats.totalListings > 0 ? `+${Math.floor(stats.totalListings * 0.12)}% this week` : '+0% today',
      trendColor: 'text-green-400',
      icon: Building
    },
    {
      title: 'TOTAL VIEWS',
      value: stats.totalViews.toLocaleString(),
      trend: stats.totalViews > 0 ? `+${Math.floor(stats.totalViews * 0.08)}% this week` : '+0% today',
      trendColor: 'text-green-400',
      icon: Eye
    },
    {
      title: 'ACTIVE RENTALS',
      value: stats.activeRentals.toString(),
      status: `${stats.activeRentals} Active`,
      statusColor: 'text-green-400',
      icon: Home
    },
    {
      title: 'PROPERTIES SOLD',
      value: stats.propertiesSold.toString(),
      trend: stats.propertiesSold > 0 ? `+${Math.floor(stats.propertiesSold * 0.15)}% this month` : '+0% today',
      trendColor: 'text-green-400',
      icon: Building
    },
    {
      title: 'ACTIVE LEADS',
      value: stats.activeLeads.toString(),
      status: `${stats.activeLeads} new this week`,
      statusColor: 'text-blue-400',
      icon: Users
    },
    {
      title: 'INQUIRIES',
      value: stats.inquiries.toString(),
      trend: stats.inquiries > 0 ? `+${Math.floor(stats.inquiries * 0.23)}% this week` : '+0% today',
      trendColor: 'text-green-400',
      icon: MessageSquare
    }
  ];

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare, badge: stats.activeLeads > 0 ? stats.activeLeads.toString() : undefined },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    // { id: 'locate', label: 'Locate', icon: MapPin }
  ];

  const handleNavigation = (id) => {
    setActiveTab(id);

    // Dashboard is the current page, so no navigation needed
    if (id === 'dashboard') {
      return;
    }

    if (id === 'properties') {
      navigate('/landlord-properties');
    }
    if (id === 'inquiries') {
      navigate('/inquiries');
    }
    if (id === 'messages') {
      navigate('/messages');
    }
    if (id === 'calendar') {
      // For now, show a placeholder message or navigate to a calendar page
      // TODO: Create a dedicated Calendar page for managing appointments and viewings
      toast.info('Calendar feature coming soon! Manage your property viewings and appointments here.', {
        duration: 4000,
        icon: '📅',
      });
      // Uncomment when calendar page is created:
      // navigate('/calendar');
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
    // Show confirmation toast with action buttons
    toast((t) => (
      <div className="flex flex-col items-start">
        <p className="font-medium text-gray-900 mb-3">Delete Property?</p>
        <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
        <div className="flex space-x-2 w-full">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performDeleteProperty(propertyId);
            }}
            className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      style: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1rem',
        maxWidth: '320px'
      }
    });
  };

  const performDeleteProperty = async (propertyId) => {
    try {
      await removeProperty(propertyId);
      toast.success('Property deleted successfully', {
        duration: 3000, // 3 seconds
      });
    } catch (error) {
      // console.error('Error deleting property:', error);
      toast.error('Failed to delete property. Please try again.', {
        duration: 4000, // 4 seconds for errors
      });
    }
  };

  const formatPropertyAddress = (property) => {
    if (property.location && typeof property.location === 'string') {
      return property.location; // Location is stored as a string in the database
    }
    if (property.location && typeof property.location === 'object') {
      return `${property.location.city || ''}, ${property.location.state || ''}`.trim() || 'Address not specified';
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

  const formatTimeAgo = (createdAt) => {
    if (!createdAt) return 'Recently';

    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

return (
  <div className="min-h-screen bg-white flex flex-col">
    {/* Fixed Header - Optimized for mobile */}
    <div className="relative">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between max-w-full">
            {/* Logo - Better mobile sizing */}
            <div className="flex items-center min-w-0 flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-[#FF6B35] tracking-tight">
                HomeSwift
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1 justify-end">
              {/* Mobile Search Button - Improved */}
              <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0">
                <Search className="w-4 h-4 text-gray-600" />
              </button>

              {/* Desktop Search Bar - Better mobile responsiveness */}
              <div className="relative hidden sm:block flex-1 max-w-xs lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Notifications - Better mobile styling */}
              <div className="relative flex-shrink-0">
                <button className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center text-[10px] sm:text-xs font-medium">
                    {stats.inquiries > 0 ? stats.inquiries : ''}
                  </span>
                </button>
              </div>

              {/* User Profile - Cleaner mobile layout */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
                <button
                  onClick={() => setShowProfilePopup(true)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FF6B35] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('🔍 LandlordDashboard - Navbar avatar loaded:', userAvatar)}
                      onError={() => console.log('❌ LandlordDashboard - Navbar avatar failed to load:', userAvatar)}
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">{userInitials}</span>
                  )}
                </button>

                {/* Desktop user info - Better responsive behavior */}
                <div className="hidden md:block text-sm min-w-0 max-w-[120px]">
                  <div className="font-medium text-gray-900 truncate">{firstName}</div>
                  <div className="text-gray-500 text-xs truncate">
                    Agent #{user?.user_metadata?.agent_id || user?.id?.slice(-5) || '00000'}
                  </div>
                </div>

                {/* Mobile user name - Better truncation */}
                <div className="md:hidden text-sm font-medium text-gray-900 truncate max-w-[80px]">
                  {firstName}
                </div>
              </div>

              {/* Add Property Button - Much improved mobile styling */}
              <button
                onClick={() => navigate('/list-property')}
                className="text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold flex items-center space-x-1.5 sm:space-x-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex-shrink-0"
                style={{ backgroundColor: '#FF6B35' }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e85e2f')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6B35')}
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline text-sm">Add Property</span>
                <span className="sm:hidden text-sm font-bold">+</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Popup - Positioned relative to the header */}
      <ProfilePopup
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
        position="navbar"
        onAvatarUpdate={(newAvatarUrl) => {
          console.log('🔄 LandlordDashboard - Avatar update received:', newAvatarUrl);
          setUserAvatar(newAvatarUrl);
          // Force re-render by updating a timestamp
          setUserAvatar(prev => {
            console.log('🔄 LandlordDashboard - Setting new avatar:', prev !== newAvatarUrl ? newAvatarUrl : prev);
            return newAvatarUrl;
          });
        }}
      />
    </div>

    <div className="flex flex-1 pt-[56px] sm:pt-[64px] lg:pt-[76px]">
      {/* Fixed Sidebar - Desktop */}
      <aside className={`hidden lg:block fixed left-0 top-[56px] sm:top-[64px] lg:top-[76px] bottom-0 bg-white border-r border-gray-200 transition-all duration-300 ${compactMode ? 'w-16' : 'w-64'} overflow-y-auto`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setCompactMode(!compactMode)}
                className="p-1 rounded hover:bg-gray-600 transition-colors text-[#fff]"
              >
                {compactMode ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            <nav className="space-y-2 flex-1">
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
          </div>

          {/* User Profile Section - Bottom */}
          <div className="p-4 border-t border-gray-600">
            <nav className="space-y-2">
              <motion.button
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-600 transition-all duration-200 ${
                  compactMode ? 'justify-center px-2' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('🔍 LandlordDashboard - Sidebar avatar loaded:', userAvatar)}
                      onError={() => console.log('❌ LandlordDashboard - Sidebar avatar failed to load:', userAvatar)}
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">{userInitials}</span>
                  )}
                </div>
                {!compactMode && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-[#2C3E50] truncate">{firstName}</div>
                    <div className="text-xs text-gray-400 truncate">{userEmail}</div>
                  </div>
                )}
              </motion.button>
              <motion.button
                onClick={() => navigate('/landlord/settings')}
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

      {/* Mobile Bottom Navigation - Clean alternative to hamburger menu */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                }`}
                style={isActive ? { backgroundColor: '#FF6B35' } : {}}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-1" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center text-[10px] font-medium">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium leading-tight">{item.label.split(' ')[0]}</span>
              </motion.button>
            );
          })}

          {/* Mobile Logout Button */}
          <motion.button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Logout"
          >
            <LogOut className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium leading-tight">Logout</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <main className={`flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 transition-all duration-300 pb-20 lg:pb-6 ${
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
                        <span>{formatListedDate(listing.created_at)}</span>
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
}

export default LandlordDashboard;
