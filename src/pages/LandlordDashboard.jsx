import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { supabase, ensureSession } from '../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
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
  Settings as SettingsIcon,
  LogOut,
  Phone,
  MessageSquare,
  MessageCircle,
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
  Loader2,
  MoreHorizontal,
  Calculator,
  TrendingUp,
  Coins,
  Shield,
  PiggyBank,
  ClipboardList,
  DollarSign,
  Camera,
  Move3D,
  Layers,
  Database,
  Sparkles
} from 'lucide-react';
import ProfilePopup from '../components/ProfilePopup';
import NotificationCenter from '../components/NotificationCenter';

const formatTimeAgo = (date) => {
  return formatDistanceToNow(date, { addSuffix: true });
};

const LandlordDashboard = () => {
  const { user, isAuthenticated, loading: authLoading, logout, hasRole, authReady } = useAuth();
  const navigate = useNavigate();

  // All hooks must be at the top, before any conditional logic
  // State for dashboard
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('dashboard'); // Can be 'dashboard', 'properties', 'inquiries', etc.
  const [compactMode, setCompactMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
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
  const [allInquiries, setAllInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Wait for auth to be fully ready before loading data
  useEffect(() => {
    if (!authReady) {
      // console.log("⏳ Dashboard waiting for auth readiness...");
      return;
    }

    // console.log("🚀 Dashboard ready — loading data");
    
    // Load dashboard data in parallel
    const loadData = async () => {
      await Promise.all([
        loadDashboardData(),
        loadRecentData(),
        loadAllInquiries()
      ]);
      setLoading(false);
    };

    loadData();
  }, [authReady]);

  // Load recent properties and leads
  const loadRecentData = async () => {
    try {
      if (!user?.id) return;

      // Ensure Supabase session is ready
      await ensureSession();
      // console.log('✅ [RecentData] Supabase session ready');

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

      // Fetch recent inquiries (bookings) for this landlord
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          tenant_name,
          tenant_email,
          tenant_phone,
          property_title,
          property_location,
          status,
          created_at,
          move_in_date,
          lease_duration,
          special_requests,
          total_amount
        `)
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bookingsError) {
        console.error('Error fetching recent bookings:', bookingsError);
      } else {
        // Transform bookings data to match expected format for inquiries
        const transformedBookings = bookings?.map(booking => ({
          id: booking.id,
          name: booking.tenant_name,
          email: booking.tenant_email,
          time: formatTimeAgo(booking.created_at),
          message: booking.special_requests || `Booking inquiry for ${booking.property_title}`,
          phone: booking.tenant_phone,
          avatar: booking.tenant_name.split(' ').map(n => n[0]).join('').toUpperCase(),
          status: booking.status,
          property_title: booking.property_title,
          move_in_date: booking.move_in_date,
          lease_duration: booking.lease_duration,
          total_amount: booking.total_amount
        })) || [];

        setRecentLeads(transformedBookings);
        // console.log('💬 Recent bookings loaded as inquiries:', transformedBookings?.length || 0);
      }

    } catch (error) {
      // console.error('❌ Error loading recent data:', error);
    }
  };

  // Load all inquiries for the inquiries view
  const loadAllInquiries = async () => {
    try {
      if (!user?.id) return;

      // Ensure Supabase session is ready
      await ensureSession();
      // console.log('✅ [Inquiries] Supabase session ready');

      setLoadingInquiries(true);

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          tenant_name,
          tenant_email,
          tenant_phone,
          property_title,
          property_location,
          status,
          created_at,
          move_in_date,
          lease_duration,
          special_requests,
          total_amount
        `)
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading all inquiries:', error);
        toast.error('Failed to load inquiries');
        return;
      }

      // Transform bookings data to match expected format for inquiries
      const transformedBookings = bookings?.map(booking => ({
        id: booking.id,
        name: booking.tenant_name,
        email: booking.tenant_email,
        time: formatTimeAgo(booking.created_at),
        message: booking.special_requests || `Booking inquiry for ${booking.property_title}`,
        phone: booking.tenant_phone,
        avatar: booking.tenant_name.split(' ').map(n => n[0]).join('').toUpperCase(),
        status: booking.status,
        property_title: booking.property_title,
        move_in_date: booking.move_in_date,
        lease_duration: booking.lease_duration,
        total_amount: booking.total_amount
      })) || [];

      setAllInquiries(transformedBookings);
      // console.log('💬 All inquiries loaded:', transformedBookings?.length || 0);
    } catch (error) {
      console.error('❌ Error loading all inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      // Ensure Supabase session is ready
      await ensureSession();
      // console.log('✅ [Dashboard] Supabase session ready');

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

      // Fetch bookings for this landlord
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('landlord_id', user.id);

      if (bookingsError) {
        console.error('Error fetching bookings for stats:', bookingsError);
      }

      // Calculate total inquiries from bookings data
      const totalBookings = bookings?.length || 0;
      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;

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

      // Use real data instead of mock calculations
      setStats({
        totalListings: totalProperties,
        totalViews: totalViews, // Use real view data
        activeRentals: totalProperties, // All properties are considered "active" for now
        propertiesSold: 0, // Would need a "sold" status field in properties table
        activeLeads: totalBookings, // Use bookings as inquiries
        inquiries: totalBookings // Use bookings as inquiries
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
        className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-white via-gray-50 to-white p-4"
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

  // Dynamic greeting function that handles time-based greetings and special holidays
  const getDynamicGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const month = now.getMonth();
    const date = now.getDate();

    // Time-based greetings
    let timeGreeting = '';
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }

    // Special holiday greetings
    let holidayGreeting = '';

    // Check for major holidays (month is 0-indexed)
    if (month === 11 && date === 25) {
      holidayGreeting = '🎄 Merry Christmas! ';
    } else if (month === 0 && date === 1) {
      holidayGreeting = '🎉 Happy New Year! ';
    } else if (month === 3 && date >= 19 && date <= 21) { // Easter (approximate)
      holidayGreeting = '🐰 Happy Easter! ';
    } else if (month === 9 && date === 1) {
      holidayGreeting = '🇳🇬 Happy Independence Day! ';
    } else if (month === 10 && date === 1) {
      holidayGreeting = '👶 Happy Children\'s Day! ';
    } else if (month === 10 && date === 2) {
      holidayGreeting = '👨‍👩‍👧‍👦 Happy Family Day! ';
    }

    // Weekday vs weekend context
    const dayContext = dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'day';

    // Personalized messages based on activity level
    let activityMessage = '';
    if (stats.totalListings === 0) {
      activityMessage = 'Ready to list your first property?';
    } else if (stats.totalViews < 10) {
      activityMessage = 'Time to boost your property visibility!';
    } else if (stats.totalInquiries === 0) {
      activityMessage = 'Keep your listings active for more inquiries!';
    } else {
      activityMessage = 'Great job on your active listings!';
    }

    return {
      greeting: `${holidayGreeting}${timeGreeting}`,
      message: activityMessage,
      showHolidayIcon: holidayGreeting !== ''
    };
  };

  const { greeting, message, showHolidayIcon } = getDynamicGreeting();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
      await loadAllInquiries();

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
      title: 'ACTIVE LISTINGS',
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
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleNavigation = (id) => {
    if (id === 'analytics') {
      // Navigate to external analytics page
      navigate('/analytics');
      return;
    }

    if (id === 'messages') {
      // Navigate to MessageCenter
      navigate('/message-center');
      return;
    }

    setActiveTab(id);
    setActiveView(id); // Set the active view to match the navigation

    // Load inquiries when switching to inquiries view
    if (id === 'inquiries' && allInquiries.length === 0 && !loadingInquiries) {
      loadAllInquiries();
    }

    // Dashboard is the current page, so no navigation needed for other views
    // Keep everything within the same component for better UX
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

  // Property Management Functions
  const handleSelectProperty = (propertyId) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSelectAllProperties = () => {
    setSelectedProperties(
      selectedProperties.length === recentProperties.length
        ? []
        : recentProperties.map(p => p.id)
    );
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowPropertyModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedProperties.length === 0) return;

    for (const propertyId of selectedProperties) {
      try {
        await removeProperty(propertyId);
      } catch (error) {
        console.error(`Failed to delete property ${propertyId}:`, error);
      }
    }

    setSelectedProperties([]);
    await loadDashboardData();
    await loadRecentData();
    await loadAllInquiries();

    toast.success(`Deleted ${selectedProperties.length} properties`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Fixed Header - Optimized for mobile */}
      <div className="relative">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between max-w-full">
              {/* Logo - Better mobile sizing */}
              <div className="flex items-center min-w-0 shrink-0">
                <h1 className="text-lg sm:text-xl font-bold text-[#FF6B35] tracking-tight">
                  HomeSwift
                </h1>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1 justify-end">
                {/* Mobile Search Button - Improved */}
                <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0">
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
                <div className="relative shrink-0">
                  <NotificationCenter />
                </div>

                {/* User Profile - Cleaner mobile layout */}
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink-0">
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
                  className="text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold flex items-center space-x-1.5 sm:space-x-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 shrink-0"
                  style={{ backgroundColor: '#FF6B35' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e85e2f')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF6B35')}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
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
                  className="p-1 rounded hover:bg-gray-600 transition-colors text-white"
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
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                        ? 'text-white'
                        : 'text-[#2C3E50] hover:bg-gray-600 '
                        } ${compactMode ? 'justify-center px-2' : ''}`}
                      style={isActive ? { backgroundColor: '#FF6B35' } : {}}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
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
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-600 transition-all duration-200 ${compactMode ? 'justify-center px-2' : ''
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0 overflow-hidden">
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
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-600 transition-all duration-200 ${compactMode ? 'justify-center px-2' : ''
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SettingsIcon className="w-4 h-4 shrink-0" />
                  {!compactMode && <span>Settings</span>}
                </motion.button>
                <motion.button
                  onClick={handleLogout}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2C3E50] hover:bg-gray-600 transition-all duration-200 ${compactMode ? 'justify-center px-2' : ''
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {!compactMode && <span>Log out</span>}
                </motion.button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile Bottom Navigation - Clean Modern Design */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-around px-2 py-3 safe-area-pb">
            {/* Main Navigation Items - Simplified */}
            {navigationItems.slice(0, 4).map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${isActive
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  style={isActive ? { backgroundColor: '#FF6B35' } : {}}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 mb-1 ${isActive ? '' : ''}`} />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium leading-tight truncate max-w-full ${isActive ? 'text-white' : ''}`}>
                    {item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label}
                  </span>
                </motion.button>
              );
            })}

            {/* More Options - Clean Dropdown */}
            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${mobileMenuOpen
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                style={mobileMenuOpen ? { backgroundColor: '#FF6B35' } : {}}
                whileTap={{ scale: 0.95 }}
              >
                <MoreHorizontal className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium leading-tight">More</span>
              </motion.button>

              {/* Clean Dropdown Menu - Only show if there are additional items */}
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                >
                  {/* Additional navigation items */}
                  {navigationItems.slice(4).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleNavigation(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Account Actions */}
                  <div className="px-3 py-1 mb-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Account</div>
                    <button
                      onClick={() => {
                        navigate('/landlord/settings');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                    >
                      <SettingsIcon className="w-4 h-4 text-gray-600" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Clean Floating Action Button */}
          <motion.button
            onClick={() => navigate('/list-property')}
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center text-white"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(255, 107, 53, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Main Content - Scrollable */}
        <main className={`flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 transition-all duration-300 pb-20 lg:pb-6 ${compactMode ? 'lg:ml-16' : 'lg:ml-64'
          }`}>
          <div className="max-w-7xl mx-auto">
            {/* Render different views based on activeView */}
            {activeView === 'dashboard' && (
              <>
                {/* Welcome Section */}
                <div className="mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-linear-to-r from-[#FF6B35] to-[#e85e2f] rounded-2xl p-6 sm:p-8 text-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                          {greeting}, {firstName}! {showHolidayIcon && '✨'}
                        </h2>
                        <p className="text-orange-100">{message}</p>
                      </div>
                      <div className="mt-4 sm:mt-0">
                        <motion.button
                          onClick={() => navigate('/list-property')}
                          className="bg-white text-[#FF6B35] px-6 py-3 rounded-full font-semibold flex items-center space-x-2 hover:bg-gray-50 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus className="w-5 h-5" />
                          <span>Add Property</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Stats Grid - Modern Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  {statsData.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-linear-to-br from-[#FF6B35] to-[#e85e2f] rounded-full flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            {stat.trend && (
                              <div className={`text-sm ${stat.trendColor} font-medium`}>
                                {stat.trend}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                        <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          {stat.title}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Recent Leads */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Recent Inquiries</h3>
                          <p className="text-sm text-gray-500">{stats.activeLeads} new this week</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveView('inquiries')}
                        className="text-[#FF6B35] hover:text-[#e85e2f] text-sm font-medium"
                      >
                        View all
                      </button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {recentLeads.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-400" />
                          </div>
                          <h4 className="text-base font-semibold text-gray-900 mb-2">No Inquiries Yet</h4>
                          <p className="text-gray-600 text-sm">Your property inquiries will appear here</p>
                        </div>
                      ) : (
                        recentLeads.map((lead, index) => (
                          <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-medium shrink-0">
                                {lead.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900 text-sm">{lead.name}</h4>
                                  <span className="text-gray-400 text-xs shrink-0">{lead.time}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{lead.message}</p>
                                <div className="flex items-center space-x-2">
                                  <button className="px-3 py-1 bg-[#FF6B35] text-white text-xs rounded-lg hover:bg-[#e85e2f] transition-colors">
                                    Reply
                                  </button>
                                  <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors">
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                      <motion.button
                        onClick={() => setActiveView('inquiries')}
                        className="w-full flex items-center space-x-3 p-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-medium">View Inquiries</span>
                        <span className="ml-auto bg-[#FF6B35] text-white px-2 py-1 rounded-full text-xs">
                          {stats.activeLeads}
                        </span>
                      </motion.button>

                      <motion.button
                        onClick={() => navigate('/list-property')}
                        className="w-full flex items-center space-x-3 p-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Add New Property</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Recent Properties Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Recent Properties</h3>
                      <p className="text-gray-600 text-sm">Your latest property listings</p>
                    </div>
                    <button
                      onClick={() => setActiveView('properties')}
                      className="text-[#FF6B35] hover:text-[#e85e2f] text-sm font-medium"
                    >
                      View all →
                    </button>
                  </div>

                  {recentListings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="w-10 h-10 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Properties Yet</h4>
                      <p className="text-gray-600 mb-6">Start by adding your first property</p>
                      <motion.button
                        onClick={() => navigate('/list-property')}
                        className="bg-[#FF6B35] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#e85e2f] transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Add Property
                      </motion.button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentListings.slice(0, 3).map((listing, index) => (
                        <motion.div
                          key={listing.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => handleEditProperty(listing)}
                        >
                          <div className="relative h-48">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Building className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 bg-[#FF6B35] text-white text-xs font-medium rounded-full">
                                {listing.propertyType || 'Property'}
                              </span>
                            </div>
                            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                              {listing.views || 0} views
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{listing.title}</h4>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-1">{formatPropertyAddress(listing)}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-[#FF6B35]">
                                ₦{listing.price?.toLocaleString() || '0'}
                              </span>
                              <span className="text-xs text-gray-500">{formatListedDate(listing.created_at)}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}

            {/* Properties Management View */}
            {activeView === 'properties' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Properties Header */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Management</h2>
                      <p className="text-gray-600">Manage your property listings and performance</p>
                    </div>
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                      {selectedProperties.length > 0 && (
                        <motion.button
                          onClick={handleDeleteSelected}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Delete Selected ({selectedProperties.length})
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => navigate('/list-property')}
                        className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e85e2f] transition-colors flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Property</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Properties Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalListings}</div>
                      <div className="text-sm text-gray-600">Total Properties</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
                      <div className="text-sm text-gray-600">Total Views</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.activeLeads}</div>
                      <div className="text-sm text-gray-600">Active Inquiries</div>
                    </div>
                  </div>

                  {/* Properties List */}
                  {recentListings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Listed</h3>
                      <p className="text-gray-600 mb-6">Start by adding your first property to the platform</p>
                      <motion.button
                        onClick={() => navigate('/list-property')}
                        className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e85e2f] transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Add Your First Property
                      </motion.button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentListings.map((listing, index) => (
                        <motion.div
                          key={listing.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`bg-white rounded-xl border-2 overflow-hidden shadow-lg transition-all hover:shadow-xl ${selectedProperties.includes(listing.id) ? 'border-[#FF6B35] ring-2 ring-[#FF6B35] ring-opacity-20' : 'border-gray-200'
                            }`}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-4 left-4 z-10">
                            <input
                              type="checkbox"
                              checked={selectedProperties.includes(listing.id)}
                              onChange={() => handleSelectProperty(listing.id)}
                              className="w-4 h-4 text-[#FF6B35] bg-white border-gray-300 rounded focus:ring-[#FF6B35]"
                            />
                          </div>

                          <div className="relative h-48">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Building className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-4 right-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${listing.is_featured ? 'bg-green-500' : 'bg-gray-600'
                                }`}>
                                {listing.is_featured ? 'Featured' : 'Standard'}
                              </span>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                              {listing.views || 0} views
                            </div>
                          </div>

                          <div className="p-4">
                            <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{listing.title}</h4>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-1">{formatPropertyAddress(listing)}</p>

                            <div className="flex items-center space-x-4 mb-4 text-sm">
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Bed className="w-4 h-4" />
                                <span>{listing.bedrooms || listing.rooms || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Bath className="w-4 h-4" />
                                <span>{listing.bathrooms || 0}</span>
                              </div>
                              <div className="text-lg font-bold text-[#FF6B35]">
                                ₦{listing.price?.toLocaleString() || '0'}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>{formatListedDate(listing.created_at)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${listing.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {listing.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <motion.button
                                onClick={() => handleEditProperty(listing)}
                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="text-sm">Edit</span>
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteProperty(listing.id)}
                                className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Inquiries View */}
            {activeView === 'inquiries' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Property Inquiries</h2>
                    <p className="text-gray-600">Manage inquiries from potential tenants</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-500">
                      {allInquiries.length} total inquiries
                    </div>
                    <button
                      onClick={() => navigate('/inquiries')}
                      className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                      Manage All
                    </button>
                  </div>
                </div>

                {loadingInquiries ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#FF6B35] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading inquiries...</p>
                  </div>
                ) : allInquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inquiries Yet</h3>
                    <p className="text-gray-600 mb-4">Inquiries from interested tenants will appear here</p>
                    <button
                      onClick={loadAllInquiries}
                      className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allInquiries.map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          // Navigate to full inquiry management page
                          navigate('/inquiries');
                        }}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-medium shrink-0">
                            {lead.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                                <p className="text-gray-600 text-sm">{lead.email}</p>
                              </div>
                              <span className="text-gray-400 text-sm">{lead.time}</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                              <p className="text-gray-700 leading-relaxed">{lead.message}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center space-x-2 text-gray-600 text-sm">
                                <Phone className="w-4 h-4" />
                                <span>{lead.phone}</span>
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${lead.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {lead.status}
                              </span>
                            </div>
                            {lead.property_title && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Property:</span> {lead.property_title}
                              </div>
                            )}
                            {lead.move_in_date && lead.lease_duration && (
                              <div className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Move-in:</span> {formatDate(lead.move_in_date)} • {lead.lease_duration} months • ₦{lead.total_amount?.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default LandlordDashboard;
