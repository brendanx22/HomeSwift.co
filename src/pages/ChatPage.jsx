import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import ProfilePopup from '../components/ProfilePopup';
import NotificationCenter from '../components/NotificationCenter';

// Simple debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

import { supabase } from "../lib/supabaseClient";
import {
  Menu,
  X,
  User,
  Home,
  Search as SearchIcon,
  Heart,
  MessageSquare,
  Calculator,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Send,
  Filter,
  Camera,
  Clock,
  Settings,
  ArrowRight,
  Sparkles,
  Plus,
  ArrowUp,
  House,
  LogOut,
  TrendingUp,
  Shield,
  DollarSign,
  ClipboardList,
  Eye,
  Move3D,
  Users,
  Database,
  Layers,
  SlidersHorizontal,
  Loader2,
  FileUp,
  ImageUp,
  Trash2,
  ShoppingCart,
  Bed,
  Bath,
  Flame,
  Search
} from "lucide-react";

export default function ChatPage() {
  // --- authentication state ---
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut: contextSignOut, isAuthenticated, loading: authLoading } = useAuth();
  // Log user object to debug
  useEffect(() => {
    console.log('User object:', user);
  }, [user]);
  
  // Get user's display name (first name only)
  const getUserDisplayName = useCallback(() => {
    if (!user) return 'User';

    console.log('🔍 getUserDisplayName - User object:', user);

    // Comprehensive search for first name across all possible user data structures
    let firstName = null;

    // Check all possible first name fields
    const possibleFirstNameFields = [
      'firstName',
      'first_name',
      'given_name',
      'name'
    ];

    // Check direct user object properties
    for (const field of possibleFirstNameFields) {
      if (user[field]) {
        firstName = user[field];
        console.log(`🔍 getUserDisplayName - Found in user.${field}:`, firstName);
        break;
      }
    }

    // Check user_metadata if not found in main object
    if (!firstName && user.user_metadata) {
      for (const field of possibleFirstNameFields) {
        if (user.user_metadata[field]) {
          firstName = user.user_metadata[field];
          console.log(`🔍 getUserDisplayName - Found in user_metadata.${field}:`, firstName);
          break;
        }
      }
    }

    // Check app_metadata as well
    if (!firstName && user.app_metadata) {
      for (const field of possibleFirstNameFields) {
        if (user.app_metadata[field]) {
          firstName = user.app_metadata[field];
          console.log(`🔍 getUserDisplayName - Found in app_metadata.${field}:`, firstName);
          break;
        }
      }
    }

    // If we have a full name in any format, extract just the first name
    const fullNameFields = ['full_name', 'fullName', 'display_name', 'displayName'];

    for (const field of fullNameFields) {
      if (user[field] && !firstName) {
        firstName = user[field].split(' ')[0];
        console.log(`🔍 getUserDisplayName - Extracted from ${field}:`, firstName);
        break;
      }
      if (user.user_metadata?.[field] && !firstName) {
        firstName = user.user_metadata[field].split(' ')[0];
        console.log(`🔍 getUserDisplayName - Extracted from user_metadata.${field}:`, firstName);
        break;
      }
    }

    // Fallback to email username if nothing else found
    if (!firstName && user.email) {
      firstName = user.email.split('@')[0];
      console.log('🔍 getUserDisplayName - Using email username:', firstName);
    }

    // Final fallback
    if (!firstName) {
      firstName = 'User';
      console.log('🔍 getUserDisplayName - Using fallback: User');
    }

    // Clean up the first name - ensure it's only the first word
    let cleanedFirstName = firstName;

    // Remove any dots or special characters
    cleanedFirstName = cleanedFirstName.replace(/[.-]/g, ' ').trim();

    // Take only the first word if there are still spaces
    if (cleanedFirstName.includes(' ')) {
      cleanedFirstName = cleanedFirstName.split(' ')[0];
    }

    // Remove any remaining special characters
    cleanedFirstName = cleanedFirstName.replace(/[^a-zA-Z]/g, '');

    console.log('🔍 getUserDisplayName - Final cleaned result:', cleanedFirstName);

    // Format the first name (capitalize first letter only)
    const result = cleanedFirstName.charAt(0).toUpperCase() + cleanedFirstName.slice(1).toLowerCase();
    console.log('🔍 getUserDisplayName - Final formatted result:', result);

    return result;
  }, [user]);
  
  // UI state
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // Avatar state for navbar display
  const [userAvatar, setUserAvatar] = useState(null);

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
    } else if (month === 4 && date === 29) {
      holidayGreeting = '👶 Happy Children\'s Day! ';
    } else if (month === 9 && date === 1) {
      holidayGreeting = '👨‍👩‍👧‍👦 Happy Family Day! ';
    }

    // Personalized activity messages for chat context
    let activityMessage = '';
    if (user) {
      activityMessage = 'How can I help you find your perfect property today?';
    } else {
      activityMessage = 'Sign in to get personalized property recommendations!';
    }

    return {
      greeting: `${holidayGreeting}${timeGreeting}`,
      message: activityMessage,
      showHolidayIcon: holidayGreeting !== ''
    };
  };

  const { greeting, message, showHolidayIcon } = getDynamicGreeting();

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
          console.error('Error loading user avatar:', error);
          return;
        }

        setUserAvatar(data?.avatar_url || null);
      } catch (err) {
        console.error('Error loading user avatar:', err);
        setUserAvatar(null);
      }
    };

    loadUserAvatar();
  }, [user]);
  const handleSend = useCallback(() => {
    if (searchInput.trim()) {
      // Here you can add logic to handle the search query
      console.log('Searching for:', searchInput);
      // Clear the input after sending
      setSearchInput('');
    }
  }, [searchInput]);
  

  // Handle authentication state and redirects
  useEffect(() => {
    if (authLoading) return; // Don't do anything while loading

    const currentPath = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const isAuthPage = ['/login', '/signup', '/auth/callback'].includes(currentPath);

    // If user is authenticated
    if (isAuthenticated && user) {
      // If on an auth page, redirect to home or the stored redirect URL
      if (isAuthPage) {
        const redirectTo = searchParams.get('redirect') || '/';
        if (currentPath !== redirectTo) {
          navigate(redirectTo, { replace: true });
        }
      }
    } 
    // If user is not authenticated
    else if (!isAuthenticated) {
      // If not on an auth page and not already going to login, redirect to login
      if (!isAuthPage && !currentPath.startsWith('/login')) {
        const returnTo = encodeURIComponent(currentPath + location.search);
        navigate(`/login?redirect=${returnTo}`, { replace: true });
      }
    }
  }, [user, isAuthenticated, authLoading, location, navigate]);
  
  // Show loading state while checking auth
  if (authLoading) {
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

  // Prefill search fields from URL params (supports HeroSection redirect to chat)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    const loc = params.get('location') || '';
    const type = params.get('type') || '';
    if (q) setSearchQuery(q);
    if (loc) setSearchLocation(loc);
    if (type) setPropertyType(type);
  }, [location.search]);

  // Check if current route is a chat route
  const isChat = location.pathname.startsWith('/chat');

  // If the user lands on chat root with a search param and is already authenticated,
  // automatically route to the results page to complete the flow
  useEffect(() => {
    if (!isChat) return;
    if (location.pathname !== '/') return;
    if (!isAuthenticated) return;
    if (autoRoutedRef.current) return;

    const params = new URLSearchParams(location.search);
    const hasQuery = params.get('search');
    if (hasQuery) {
      autoRoutedRef.current = true;
      navigate(`/properties?${params.toString()}`);
    }
  }, [isChat, isAuthenticated, location.pathname, location.search, navigate]);

  // Handle logout
  const handleLogout = async () => {
    try {
      // 1. First, clear all client-side storage
      const clearStorage = () => {
        // Clear all forms of storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        });
      };
      
      // 2. Clear storage immediately
      clearStorage();
      
      // 3. Call the server-side logout endpoint if it exists
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include', // Important for clearing HTTP-only cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (apiError) {
        console.warn('API signout failed, continuing with client-side cleanup', apiError);
      }
      
      // 4. Clear any auth state in the app
      if (typeof contextSignOut === 'function') {
        try {
          await contextSignOut();
        } catch (signOutError) {
          console.warn('Context sign out failed, continuing with full page reload', signOutError);
        }
      }
      
      // 5. Clear any service worker caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (cacheError) {
          console.warn('Failed to clear cache:', cacheError);
        }
      }
      
      // 6. Force a full page reload with a clean state
      // Add a random parameter to prevent caching
      const timestamp = `?t=${Date.now()}&from=logout`;
      
      // 7. Clear any remaining state and redirect
      window.history.replaceState(null, '', '/login' + timestamp);
      
      // 8. Use a small delay to ensure all state is cleared
      setTimeout(() => {
        // Clear storage one more time before redirecting
        clearStorage();
        // Force a hard redirect to the login page
        window.location.href = '/login' + timestamp;
      }, 50);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Last resort: force redirect with a fresh state
      window.location.href = '/login?from=logout&t=' + Date.now();
    }
  };

  // --- navigation state ---
  const [activeTab, setActiveTab] = useState("browse");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Motion values for interactive elements
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Navigation items with their respective routes
  const navItems = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <Home className="w-5 h-5" /> },
    { id: 'market-analysis', label: 'Market Analysis', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'neighborhood-info', label: 'Neighborhood Info', icon: <MapPin className="w-5 h-5" /> },
    { id: 'price-calculator', label: 'Price Calculator', icon: <Calculator className="w-5 h-5" /> },
    { id: 'insurance-calculator', label: 'Insurance Calculator', icon: <Shield className="w-5 h-5" /> },
    { id: 'tax-calculator', label: 'Tax Calculator', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'inspection-checklist', label: 'Inspection Checklist', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'virtual-tours', label: 'Virtual Tours', icon: <Camera className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-5 h-5" /> },
    { id: 'search-history', label: 'Search History', icon: <Clock className="w-5 h-5" /> },
  ];

  // Handle sidebar navigation
  const handleSidebarNavigation = (label) => {
    switch(label) {
      case 'AI Assistant':
        // Stay on current page (chat)
        break;
      case 'Messages':
        navigate('/messages');
        break;
      case 'Market Analysis':
        navigate('/market-analysis');
        break;
      case 'Neighborhood Info':
        navigate('/neighborhoods');
        break;
      case 'Price Calculator':
        navigate('/calculator');
        break;
      case 'Inspection Checklist':
        navigate('/inspection-checklist');
        break;
      case 'Virtual Tours':
        navigate('/virtual-tours');
        break;
      case 'Favorites':
        navigate('/saved');
        break;
      case 'Search History':
        // For now, just log - could implement a history modal/page later
        console.log('Search History clicked - implement history page');
        break;
      default:
        console.log('Unknown sidebar navigation:', label);
        break;
    }
  };

  // --- search state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000000]); // Default range
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [purchaseType, setPurchaseType] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [searchIntent, setSearchIntent] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const previewDropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const autoRoutedRef = useRef(false);
  
  // Load featured and recent properties only on non-chat domains
  useEffect(() => {
    if (isChat) return;
    
    const loadProperties = async () => {
      try {
        // Get featured properties (e.g., where is_featured is true)
        const { data: featuredData, error: featuredError } = await supabase
          .from('properties')
          .select('*')
          .eq('is_featured', true)
          .limit(6);
          
        if (featuredError) throw featuredError;

        // Get recent properties (ordered by created_at)
        const { data: recentData, error: recentError } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);
          
        if (recentError) throw recentError;

        setFeaturedProperties(featuredData || []);
        setRecentProperties(recentData || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
      }
    };

    loadProperties();
  }, [isChat]);

  // Handle search submission
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    
    const query = searchQuery.trim();
    
    if (!query) {
      setSearchError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // If not authenticated, prompt login and return to chat main landing with the query preserved
      if (!isAuthenticated) {
        const searchParams = new URLSearchParams({ search: query });
        if (searchLocation) searchParams.set('location', searchLocation);
        if (propertyType) searchParams.set('type', propertyType);
        const redirectTarget = `${window.location.origin}/browse?${searchParams.toString()}`;
        navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }

      // Save search history if user is authenticated
      if (user?.id) {
        const { error } = await supabase
          .from('search_history')
          .insert([
            { 
              user_id: user.id, 
              query: query,
              search_data: {
                location: searchLocation,
                propertyType: propertyType
              }
            }
          ]);
          
        if (error) console.error('Error saving search history:', error);
      }
      // Navigate to the results page with the query - ensure proper navigation
      const searchParams = new URLSearchParams({ search: query });
      if (searchLocation) searchParams.set('location', searchLocation);
      if (propertyType) searchParams.set('type', propertyType);

      // Use window.location for direct navigation to avoid dashboard interference
      window.location.href = `/browse?${searchParams.toString()}`;
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Load search history and popular searches
  useEffect(() => {
    const loadSearchData = async () => {
      if (!user?.id) return;

      try {
        // Load search history
        const { data: historyData, error: historyError } = await supabase
          .from('search_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!historyError && historyData) {
          setSearchHistory(historyData.map(item => item.query));
        }

        // Load popular searches (from all users)
        const { data: popularData, error: popularError } = await supabase
          .from('search_history')
          .select('query')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!popularError && popularData) {
          const popularQueries = popularData
            .map(item => item.query)
            .filter((query, index, arr) => arr.indexOf(query) === index) // Remove duplicates
            .slice(0, 5);
          setPopularSearches(popularQueries);
        }
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    };

    loadSearchData();
  }, [user?.id]);

  // Enhanced intelligent search parser - handles complex queries with multiple features
  const parseSearchQuery = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/);
    const intent = {
      location: null,
      propertyType: null,
      priceRange: null,
      bedrooms: null,
      bathrooms: null,
      amenities: [],
      keywords: [],
      originalQuery: query
    };

    // Expanded location detection (Nigerian cities and areas)
    const nigerianLocations = [
      'lagos', 'abuja', 'port harcourt', 'kano', 'ibadan', 'benin city', 'maiduguri',
      'zaria', 'aba', 'jos', 'ilorin', 'oyo', 'enugu', 'akure', 'bauchi', 'jalingo',
      'victoria island', 'ikeja', 'lekki', 'surulere', 'yaba', 'ajah', 'ikoyi', 'banana island',
      'festac', 'apapa', 'ebute metta', 'mushin', 'agege', 'oshodi', 'ketu', 'berger',
      'garki', 'wuse', 'maitama', 'asokoro', 'kuje', 'lugbe', 'kuje', 'dawaki', 'katampe',
      'gwarinpa', 'kuje', 'dawaki', 'jahi', 'galadimawa', 'lokogoma', 'kubwa', 'nyanya',
      'karu', 'masaka', 'mararaba', 'keffi', 'gwagwalada', 'kuje', 'lugbe', 'dawaki'
    ];

    // Location detection with better pattern matching including prepositions
    const locationPatterns = [
      // "apartment in Lagos", "house at Victoria Island"
      /(?:in|at|near|around)\s+([A-Za-z\s]+?)(?:\s|$)/gi,
      // "Lagos apartment", "Victoria Island house" (no preposition)
      /\b([A-Za-z\s]+?)\s+(?:apartment|house|flat|duplex|bungalow|property|home|listing)\b/gi,
      // Just location names at start or end
      /^(?:find\s+)?([A-Za-z\s]+?)(?:\s|$)/gi,
      /([A-Za-z\s]+?)$/gi
    ];

    for (const pattern of locationPatterns) {
      const matches = [...lowerQuery.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          const potentialLocation = match[1].trim();
          // Check if this looks like a Nigerian location
          for (const location of nigerianLocations) {
            if (potentialLocation.toLowerCase().includes(location) ||
                location.includes(potentialLocation.toLowerCase())) {
              intent.location = location.charAt(0).toUpperCase() + location.slice(1);
              break;
            }
          }
          if (intent.location) break;
        }
      }
      if (intent.location) break;
    }

    // Enhanced property type detection with synonyms
    const propertyTypes = {
      'apartment': 'apartment',
      'flat': 'apartment',
      'house': 'house',
      'duplex': 'duplex',
      'bungalow': 'bungalow',
      'mansion': 'mansion',
      'penthouse': 'penthouse',
      'studio': 'studio',
      'room': 'room',
      'self contain': 'self-contain',
      'mini flat': 'mini-flat',
      'bedsitter': 'bedsitter',
      'one bedroom': '1-bedroom',
      'two bedroom': '2-bedroom',
      'three bedroom': '3-bedroom',
      'four bedroom': '4-bedroom',
      'five bedroom': '5-bedroom'
    };

    // Check for property type patterns
    for (const [key, value] of Object.entries(propertyTypes)) {
      if (lowerQuery.includes(key)) {
        intent.propertyType = value;
        break;
      }
    }

    // Enhanced price range detection with multiple patterns
    const pricePatterns = [
      // Range patterns: "₦500k - ₦1M", "500k to 1M", "between 500k and 1M"
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to|and|between)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Under/below patterns: "under ₦1M", "below 1M"
      /(?:under|below|less than)\s*₦?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Above/over patterns: "above ₦2M", "over 2M"
      /(?:above|over|more than)\s*₦?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Exact amounts: "₦1M", "1M"
      /₦?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:only|exactly)?/gi,
      // Plus patterns: "₦1M+"
      /₦?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*\+/gi
    ];

    for (const pattern of pricePatterns) {
      const matches = [...lowerQuery.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[2]) {
          // Range pattern
          intent.priceRange = [
            parseInt(match[1].replace(/,/g, '')),
            parseInt(match[2].replace(/,/g, ''))
          ];
        } else if (match[1]) {
          const price = parseInt(match[1].replace(/,/g, ''));
          if (lowerQuery.includes('under') || lowerQuery.includes('below') || lowerQuery.includes('less than')) {
            intent.priceRange = [0, price];
          } else if (lowerQuery.includes('above') || lowerQuery.includes('over') || lowerQuery.includes('more than')) {
            intent.priceRange = [price, 10000000];
          } else if (lowerQuery.includes('+')) {
            intent.priceRange = [price, 10000000];
          } else {
            // Single price - assume it's a maximum
            intent.priceRange = [0, price];
          }
        }
      }
    }

    // Enhanced bedroom detection with multiple patterns
    const bedroomPatterns = [
      /(\d+)\s*(?:bedroom|bed|br|bd)/gi,
      /(\d+)\s*(?:room|rm)/gi,
      /(?:(\d+)\s*bedroom|(\d+)\s*bed|(\d+)\s*br|(\d+)\s*bd)/gi
    ];

    for (const pattern of bedroomPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        // Find the first number in the match
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            intent.bedrooms = parseInt(match[i]);
            break;
          }
        }
        if (intent.bedrooms) break;
      }
    }

    // Enhanced bathroom detection
    const bathroomPatterns = [
      /(\d+)\s*(?:bathroom|bath|ba|toilet|wc)/gi,
      /(?:(\d+)\s*bathroom|(\d+)\s*bath|(\d+)\s*ba|(\d+)\s*toilet|(\d+)\s*wc)/gi
    ];

    for (const pattern of bathroomPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            intent.bathrooms = parseInt(match[i]);
            break;
          }
        }
        if (intent.bathrooms) break;
      }
    }

    // Enhanced amenity detection with more keywords and better matching
    const amenityKeywords = {
      'parking': 'Parking',
      'security': 'Security',
      'gym': 'Gym',
      'pool': 'Swimming Pool',
      'garden': 'Garden',
      'balcony': 'Balcony',
      'furnished': 'Furnished',
      'generator': 'Generator',
      'borehole': 'Borehole',
      'cctv': 'CCTV',
      'elevator': 'Elevator',
      'internet': 'Internet',
      'air conditioning': 'Air Conditioning',
      'pet friendly': 'Pet Friendly',
      'garage': 'Garage',
      'swimming pool': 'Swimming Pool',
      'air condition': 'Air Conditioning',
      'water': 'Water',
      'electricity': 'Electricity',
      'power': 'Power',
      'backup': 'Backup',
      'serviced': 'Serviced',
      'new': 'New',
      'modern': 'Modern',
      'spacious': 'Spacious',
      'clean': 'Clean',
      'safe': 'Safe',
      'quiet': 'Quiet',
      'central': 'Central',
      'prime': 'Prime',
      'luxury': 'Luxury',
      'affordable': 'Affordable'
    };

    for (const [keyword, amenity] of Object.entries(amenityKeywords)) {
      if (lowerQuery.includes(keyword)) {
        if (!intent.amenities.includes(amenity)) {
          intent.amenities.push(amenity);
        }
      }
    }

    // Extract remaining keywords as search terms
    const stopWords = ['in', 'at', 'for', 'with', 'and', 'or', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'];
    intent.keywords = words.filter(word => !stopWords.includes(word.toLowerCase()) && word.length > 2);

    return intent;
  };

  // Handle intelligent search input change
  const handleIntelligentSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchError(null);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      setShowSuggestions(true);

      // Parse search intent for intelligent suggestions
      const intent = parseSearchQuery(value);
      setSearchIntent(intent);

      // Debounce suggestions loading
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Build flexible search query for suggestions
          let suggestionQuery = supabase.from('properties').select('title, location, price, bedrooms, bathrooms, images, id, property_type, description, amenities, is_featured');

          // If we have parsed intent, use it for better suggestions
          if (intent.location || intent.propertyType || intent.bedrooms || intent.bathrooms) {
            // Build OR query for multiple criteria
            const conditions = [];

            if (intent.location) {
              conditions.push(`location.ilike.%${intent.location}%`);
            }

            if (intent.propertyType) {
              conditions.push(`property_type.ilike.%${intent.propertyType}%`);
            }

            if (intent.bedrooms) {
              conditions.push(`bedrooms.eq.${intent.bedrooms}`);
              conditions.push(`bedrooms.eq.${intent.bedrooms - 1}`);
              conditions.push(`bedrooms.eq.${intent.bedrooms + 1}`);
            }

            if (intent.bathrooms) {
              conditions.push(`bathrooms.eq.${intent.bathrooms}`);
              conditions.push(`bathrooms.eq.${intent.bathrooms - 1}`);
              conditions.push(`bathrooms.eq.${intent.bathrooms + 1}`);
            }

            if (intent.priceRange) {
              const [minPrice, maxPrice] = intent.priceRange;
              conditions.push(`price.gte.${Math.floor(minPrice * 0.8)}`);
              conditions.push(`price.lte.${Math.ceil(maxPrice * 1.2)}`);
            }

            // Add text search for remaining keywords
            if (intent.keywords.length > 0) {
              const keywordConditions = intent.keywords.map(keyword =>
                `(title.ilike.%${keyword}% OR location.ilike.%${keyword}% OR description.ilike.%${keyword}%)`
              );
              conditions.push(`(${keywordConditions.join(' OR ')})`);
            }

            // Add amenity search
            if (intent.amenities.length > 0) {
              const amenityConditions = intent.amenities.map(amenity =>
                `amenities.cs.{${amenity}}`
              );
              conditions.push(`(${amenityConditions.join(' OR ')})`);
            }

            if (conditions.length > 0) {
              suggestionQuery = suggestionQuery.or(conditions.join(' OR '));
            }
          } else {
            // Fallback to text search if no structured intent found
            suggestionQuery = suggestionQuery.or(`title.ilike.%${value}%,location.ilike.%${value}%,description.ilike.%${value}%`);
          }

          const { data: suggestions, error } = await suggestionQuery.limit(12);

          if (!error && suggestions) {
            setSuggestions(suggestions.map(property => ({
              ...property,
              relevance: calculateRelevance(property, intent, value)
            })).sort((a, b) => b.relevance - a.relevance));
          }

          // Get location suggestions if intent detected location
          if (intent.location) {
            const nigerianCities = [
              'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City',
              'Victoria Island', 'Ikeja', 'Lekki', 'Surulere', 'Yaba', 'Ikoyi',
              'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Kuje', 'Lugbe', 'Dawaki'
            ];
            const filteredCities = nigerianCities.filter(city =>
              city.toLowerCase().includes(intent.location.toLowerCase())
            );
            setLocationSuggestions(filteredCities);
          }
        } catch (error) {
          console.error('Failed to load intelligent suggestions:', error);
          setSuggestions([]);
          setLocationSuggestions([]);
        }
      }, 300);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setLocationSuggestions([]);
      setSearchIntent(null);
    }
  };

  // Enhanced relevance scoring for search results with fallback strategies
  const calculateRelevance = (property, intent, query) => {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerTitle = property.title?.toLowerCase() || '';
    const lowerLocation = property.location?.toLowerCase() || '';
    const lowerDescription = property.description?.toLowerCase() || '';

    // Base scoring for exact matches (highest priority)
    if (lowerTitle.includes(lowerQuery)) {
      score += 20;
    }

    // Location matches (high priority)
    if (intent.location && lowerLocation.includes(intent.location.toLowerCase())) {
      score += 15;
    }

    // Property type matches
    if (intent.propertyType && property.property_type?.toLowerCase().includes(intent.propertyType.toLowerCase())) {
      score += 12;
    }

    // Price range matches (flexible - within 20% tolerance)
    if (intent.priceRange && property.price) {
      const [minPrice, maxPrice] = intent.priceRange;
      const priceMatch = (property.price >= minPrice * 0.8 && property.price <= maxPrice * 1.2);
      if (priceMatch) {
        score += 10;
      }
    }

    // Bedroom matches (exact or within 1)
    if (intent.bedrooms && property.bedrooms) {
      const bedroomDiff = Math.abs(property.bedrooms - intent.bedrooms);
      if (bedroomDiff === 0) {
        score += 8;
      } else if (bedroomDiff <= 1) {
        score += 4;
      }
    }

    // Bathroom matches (exact or within 1)
    if (intent.bathrooms && property.bathrooms) {
      const bathroomDiff = Math.abs(property.bathrooms - intent.bathrooms);
      if (bathroomDiff === 0) {
        score += 8;
      } else if (bathroomDiff <= 1) {
        score += 4;
      }
    }

    // Amenity matches (partial keyword matching)
    if (intent.amenities.length > 0) {
      const propertyAmenities = [
        ...(property.amenities || []),
        lowerTitle,
        lowerDescription,
        lowerLocation
      ].join(' ').toLowerCase();

      const matchingAmenities = intent.amenities.filter(amenity =>
        propertyAmenities.includes(amenity.toLowerCase())
      );
      score += matchingAmenities.length * 5;
    }

    // Keyword matches (from remaining search terms)
    if (intent.keywords.length > 0) {
      const searchText = [lowerTitle, lowerLocation, lowerDescription].join(' ');
      const keywordMatches = intent.keywords.filter(keyword =>
        searchText.includes(keyword)
      );
      score += keywordMatches.length * 3;
    }

    // Fuzzy text matching for overall query relevance
    const searchWords = lowerQuery.split(/\s+/).filter(word => word.length > 2);
    for (const word of searchWords) {
      if (lowerTitle.includes(word) || lowerLocation.includes(word) || lowerDescription.includes(word)) {
        score += 2;
      }
    }

    // Boost score for recent/popular properties
    if (property.is_featured) {
      score += 3;
    }

    // Penalty for very old or incomplete listings
    if (!property.images || property.images.length === 0) {
      score -= 2;
    }

    return Math.max(0, score);
  };

  // Handle intelligent search submission
  const handleIntelligentSearchSubmit = async (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setSearchError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Parse search intent for intelligent routing
      const intent = parseSearchQuery(query);

      // Save search to history if user is authenticated
      if (user?.id) {
        await supabase
          .from('search_history')
          .insert([{
            user_id: user.id,
            query: query,
            search_data: intent
          }]);
      }

      // Build search parameters for intelligent routing
      const searchParams = new URLSearchParams();

      // Always include the original query as a fallback
      if (query) searchParams.set('search', query);

      // Add parsed intent parameters if they exist
      if (intent.location) searchParams.set('location', intent.location);
      if (intent.propertyType) searchParams.set('type', intent.propertyType);

      // Handle price range more flexibly
      if (intent.priceRange) {
        const [minPrice, maxPrice] = intent.priceRange;
        if (minPrice > 0) searchParams.set('minPrice', minPrice);
        if (maxPrice < 10000000) searchParams.set('maxPrice', maxPrice);
      }

      // Add flexible bedroom/bathroom matching
      if (intent.bedrooms) {
        // Search for exact match first, then within range
        searchParams.set('bedrooms', intent.bedrooms);
      }

      if (intent.bathrooms) {
        searchParams.set('bathrooms', intent.bathrooms);
      }

      // Add amenities as search keywords
      if (intent.amenities.length > 0) {
        searchParams.set('amenities', intent.amenities.join(','));
      }

      // Add remaining keywords as general search terms
      if (intent.keywords.length > 0) {
        searchParams.set('keywords', intent.keywords.join(' '));
      }

      // Add purchase type if specified
      if (purchaseType) searchParams.set('purchaseType', purchaseType);

      // Navigate to intelligent search results - ensure proper navigation
      const searchUrl = `/browse?${searchParams.toString()}`;
      console.log('Intelligent search URL:', searchUrl);

      // Use window.location for direct navigation to avoid dashboard interference
      window.location.href = searchUrl;
    } catch (error) {
      console.error('Intelligent search error:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion selection with intelligent parsing
  const handleIntelligentSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);

    // Auto-fill location if available
    if (suggestion.location) {
      setSearchLocation(suggestion.location);
    }

    // Trigger search after a brief delay - ensure proper navigation
    setTimeout(() => {
      handleIntelligentSearchSubmit({ preventDefault: () => {} });
    }, 100);
  };
  
  // --- responsive sidebar state ---
  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  });
  const [isSmUp, setIsSmUp] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 640 : false;
  });
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Use refs to track previous values to prevent unnecessary state updates
  const prevIsDesktop = useRef(isDesktop);
  const prevIsSmUp = useRef(isSmUp);
  
  // Single source of truth for window size state
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsDesktop = width >= 1024;
      const newIsTablet = width >= 640;
      
      // Only update state if values actually change
      if (newIsTablet !== prevIsSmUp.current) {
        prevIsSmUp.current = newIsTablet;
        setIsSmUp(newIsTablet);
      }
      
      if (newIsDesktop !== prevIsDesktop.current) {
        prevIsDesktop.current = newIsDesktop;
        setIsDesktop(newIsDesktop);
        
        // Auto-hide mobile sidebar on desktop
        if (newIsDesktop) {
          setShowMobileSidebar(false);
        }
      }
      
      // Check mobile sidebar state - only update if needed
      if (!newIsDesktop && !showMobileSidebar && localStorage.getItem('sidebarOpen') === null) {
        setShowMobileSidebar(false);
      }
    };
    
    // Initial check
    handleResize();
    
    // Debounce the resize handler
    const debouncedResize = debounce(handleResize, 100);
    window.addEventListener('resize', debouncedResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize);
      debouncedResize.cancel?.();
    };
    // Empty dependency array because we don't want this effect to re-run
    // when state changes, only on mount/unmount
  }, []);
  
  const [compactMode, setCompactMode] = useState(() => {
    // Initialize compact mode from localStorage if it exists
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCompact');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Persist compact mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCompact', JSON.stringify(compactMode));
    }
  }, [compactMode]);

  // Persist mobile sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isDesktop) {
      localStorage.setItem('sidebarMobileOpen', JSON.stringify(showMobileSidebar));
    }
  }, [showMobileSidebar, isDesktop]);

  // Load initial state from localStorage on mount
  useEffect(() => {
    try {
      const savedCompact = localStorage.getItem('sidebarCompact');
      if (savedCompact !== null) setCompactMode(JSON.parse(savedCompact));
      
      // Only load mobile sidebar state if we're on mobile
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        const savedMobileOpen = localStorage.getItem('sidebarMobileOpen');
        if (savedMobileOpen !== null) setShowMobileSidebar(JSON.parse(savedMobileOpen));
      }
    } catch (e) {
      console.error("Failed to load sidebar state:", e);
    }
  }, []);

  // --- preview, uploads, UI state ---
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showPlusDropdown, setShowPlusDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Quick actions for search
  const quickActions = [
    { 
      id: 'find', 
      label: 'Find Properties', 
      icon: () => <SearchIcon className="h-4 w-4" /> 
    },
    { 
      id: 'mortgage', 
      label: 'Mortgage Calculator', 
      icon: () => <Calculator className="h-4 w-4" /> 
    },
    { 
      id: 'neighborhood', 
      label: 'Neighborhoods', 
      icon: () => <MapPin className="h-4 w-4" /> 
    },
    { 
      id: 'featured', 
      label: 'Featured Homes', 
      icon: () => <Home className="h-4 w-4" /> 
    }
  ];
  
  // --- preview state ---
  const [previewItem, setPreviewItem] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  
  // --- chat data ---
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('hs_chat_history_v1');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [activeChat, setActiveChat] = useState(null);
  const [hoveredChat, setHoveredChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  // --- responsive listener ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = (e) => setIsSmUp(e.matches);
    try {
      mq.addEventListener("change", handler);
    } catch (e) {
      mq.addListener(handler);
    }
    return () => {
      try {
        mq.removeEventListener("change", handler);
      } catch (e) {
        mq.removeListener(handler);
      }
    };
  }, []);

  // -- persist some state to localStorage --
  useEffect(() => {
    localStorage.setItem("hs_chat_history_v1", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem("hs_compact_v1", JSON.stringify(compactMode));
  }, [compactMode]);

  // Clean up old localStorage keys
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove old keys if they exist
      localStorage.removeItem("hs_show_side_v1");
      localStorage.removeItem("hs_compact_v1");
    }
  }, []);

  // --- click outside for preview ---
  useEffect(() => {
    if (!previewItem) return;
    const handleClickOutside = (event) => {
      if (previewDropdownRef.current && !previewDropdownRef.current.contains(event.target)) {
        setPreviewItem(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [previewItem]);

  // --- manage object URL for preview (images, pdfs, docx download) ---
  useEffect(() => {
    if (!previewItem || !previewItem.file) {
      setPreviewURL(null);
      return;
    }

    // if we already have fileText (text preview), no objectURL needed
    if (previewItem.fileText) return;

    const url = URL.createObjectURL(previewItem.file);
    setPreviewURL(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
      setPreviewURL(null);
    };
  }, [previewItem]);

  // File upload handlers
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFiles((p) => [...p, file]);
    e.target.value = null;
  };

  // Image upload handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadedImages((p) => [...p, file]);
    e.target.value = null;
  };
  
  // Cleanup functions
  const handleRemoveFile = (index) => setUploadedFiles((p) => p.filter((_, i) => i !== index));
  const handleRemoveImage = (index) => setUploadedImages((p) => p.filter((_, i) => i !== index));

  // --- preview logic (text/pdf/image/docx) ---
  const handlePreviewItem = (item) => {
    if (item.type === 'image') {
      setPreviewItem({
        ...item,
        url: URL.createObjectURL(item.file)
      });
    } else if (item.type === 'pdf') {
      setPreviewItem({
        ...item,
        url: URL.createObjectURL(item.file)
      });
    } else {
      // For text files, read as text
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewItem({
          ...item,
          fileText: e.target.result
        });
      };
      reader.readAsText(item.file);
    }
  };

  const closePreview = () => setPreviewItem(null);

  // --- suggestions / search ---
  const handleSuggestionClick = () => {
    setShowSuggestions(!showSuggestions);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    // Trigger search with the selected suggestion - ensure proper navigation
    setTimeout(() => {
      handleSearchSubmit({ preventDefault: () => {} });
    }, 100);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setChatHistory((p) => p.filter((c) => c.id !== id));
    if (activeChat === id) setActiveChat(null);
  };

  // --- animation variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.45 } } };

  // --- dynamic layout calc ---
  const sidebarWidthPx = compactMode ? 80 : (isSmUp ? 320 : 0);

  // Remove conflicting auth logic - AuthProvider handles this

  // Set body background
  useEffect(() => {
    document.body.style.backgroundImage = 'url("/Rectangle 135.png")';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    
    return () => {
      // Cleanup on unmount
      document.body.style.backgroundSize = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    };
  }, []);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white flex flex-col"
    >
      {/* Mobile Navigation - Single compact button */}
      {!isDesktop && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="fixed left-4 top-4 z-30 sm:hidden"
        >
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#FF6B35' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMobileSidebar(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FF6B35] text-white shadow-lg transition-all duration-200"
            aria-label="Open navigation"
          >
            <MessageSquare className="text-white" size={18} />
          </motion.button>
        </motion.div>
      )}

      {/* Sidebar - Always render on desktop, conditionally on mobile */}
      <AnimatePresence initial={false}>
        {(showMobileSidebar || isDesktop) && (
          <>
            {/* mobile overlay to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black/50 z-40 sm:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />

            <motion.aside
              initial={isDesktop ? { x: 0, opacity: 1 } : { x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={isDesktop ? { x: 0, opacity: 1 } : { x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className={`fixed left-0 top-0 z-50 h-full backdrop-blur-xl flex flex-col border-r border-gray-200/80 ${compactMode ? 'w-16' : 'w-72'}`}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
                boxShadow: '4px 0 20px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* HomeSwift sidebar header */}
              <div className="p-4 flex-shrink-0 bg-gradient-to-br from-white to-gray-50/50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-8 mt-6">
                  <div className="flex items-center gap-3">
                    {compactMode ? (
                      <div className="flex justify-center w-full">
                        <img src="/images/logo.png" alt="HomeSwift Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                      </div>
                    ) : (
                      <>
                        <img src="/images/logo.png" alt="HomeSwift Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                        <span className="text-[#FF6B35] font-bold text-xl tracking-tight">HomeSwift</span>
                      </>
                    )}
                  </div>

                  {!compactMode && (
                    <div className="flex items-center gap-1">
                      {!isDesktop ? (
                        <button 
                          onClick={() => setShowMobileSidebar(false)} 
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-[#2C3E50] transition-all duration-200"
                        >
                          <X size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setCompactMode((s) => !s)}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-[#2C3E50] transition-all duration-200"
                          title={compactMode ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                          {compactMode ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {compactMode && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setCompactMode((s) => !s)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-[#2C3E50] transition-all duration-200"
                      title="Expand sidebar"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* HomeSwift sidebar navigation */}
              <div className="flex-1 overflow-y-auto px-2 pb-2 mt-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="space-y-1">
                  {[
                    { icon: MessageSquare, label: 'AI Assistant', active: location.pathname === '/chat' },
                    { icon: MessageSquare, label: 'Messages', active: false },
                    { icon: TrendingUp, label: 'Market Analysis', active: location.pathname === '/market-analysis' },
                    { icon: MapPin, label: 'Neighborhood Info', active: location.pathname === '/neighborhoods' },
                    { icon: Calculator, label: 'Price Calculator', active: location.pathname === '/calculator' },
                    { icon: ClipboardList, label: 'Inspection Checklist', active: location.pathname === '/inspection-checklist' },
                    { icon: Heart, label: 'Favorites', active: location.pathname === '/saved' },
                    { icon: Clock, label: 'Search History', active: false }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, delay: idx * 0.05 }}
                      className={`group relative flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        item.active 
                          ? 'bg-[#FF6B35] text-white shadow-lg' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-[#FF6B35] hover:shadow-sm'
                      }`}
                      onClick={() => handleSidebarNavigation(item.label)}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      {!compactMode && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Chat History */}
                {!compactMode && (
                  <div className="mt-8 px-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">AI Conversations</h3>
                    <div className="space-y-2">
                      {chatHistory.slice(0, 5).map((chat) => (
                        <motion.div
                          key={chat.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.18 }}
                          onMouseEnter={() => setHoveredChat(chat.id)}
                          onMouseLeave={() => setHoveredChat(null)}
                          onClick={() => { 
                            setActiveChat(chat.id); 
                            if (!isSmUp) setShowSidePanel(false); 
                          }}
                          className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                            activeChat === chat.id 
                              ? 'bg-[#FF6B35]/10 text-[#2C3E50] border border-[#FF6B35]/20 shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-100 hover:text-[#FF6B35] hover:shadow-sm'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{chat.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{chat.date}</p>
                          </div>

                          {(hoveredChat === chat.id || activeChat === chat.id) && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button 
                                onClick={(e) => deleteChat(chat.id, e)}
                                className="p-1 rounded hover:bg-red-50 transition-colors duration-200"
                                title="Delete"
                              >
                                <Trash2 size={12} className="text-gray-500 hover:text-red-400" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* HomeSwift sidebar footer */}
              <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 to-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  {!compactMode && (
                    <div className="flex items-center gap-3">
                      {user ? (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#e85e2f] flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white text-sm font-bold">
                              {getUserDisplayName().charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[#2C3E50] text-sm font-semibold truncate">
                              {getUserDisplayName()}
                            </span>
                            <span className="text-gray-500 text-xs truncate">
                              {user?.email}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                            <User size={14} className="text-gray-500" />
                          </div>
                          <span className="text-gray-500 text-sm">Not logged in</span>
                        </>
                      )}
                    </div>
                  )}
                  {user && (
                    <button
                      onClick={handleLogout}
                      className="p-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                      title="Logout"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top Nav */}
      <div className="relative">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="sticky top-0 z-10 flex items-center justify-end p-3 sm:p-6 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80"
          style={{
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* User Profile - Avatar Only */}
          <div className="flex items-center">
            <div className="mr-4">
              <NotificationCenter />
            </div>
            {user ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center"
              >
                <div className="hidden sm:flex sm:flex-col sm:items-end mr-3">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-sm font-medium text-[#2C3E50]"
                  >
                    {getUserDisplayName()}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="text-xs text-gray-500"
                  >
                    {user?.email}
                  </motion.span>
                </div>
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4, type: "spring", stiffness: 300 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
                    rotate: [0, -2, 2, 0],
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#e85e2f] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
                  }}
                  aria-label="User menu"
                >
                  <motion.div
                    animate={{
                      background: showMenu
                        ? "linear-gradient(45deg, #FF6B35, #e85e2f)"
                        : "linear-gradient(135deg, #FF6B35, #e85e2f)"
                    }}
                    className="absolute inset-0 rounded-full"
                  />
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover relative z-10"
                      onLoad={() => console.log('🔍 ChatPage - Navbar avatar loaded:', userAvatar)}
                      onError={() => console.log('❌ ChatPage - Navbar avatar failed to load:', userAvatar)}
                    />
                  ) : (
                    <motion.span
                      animate={{ rotate: showMenu ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10"
                    >
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </motion.span>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "rgba(44, 62, 80, 0.05)",
                    boxShadow: "0 2px 8px rgba(44, 62, 80, 0.15)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-[#2C3E50] hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200"
                >
                  Log In
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
                    background: "linear-gradient(135deg, #FF6B35, #e85e2f)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/signup')}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#FF6B35] to-[#e85e2f] text-white hover:shadow-lg rounded-lg transition-all duration-200"
                  style={{
                    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
                  }}
                >
                  Sign Up
                </motion.button>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut", type: "spring", stiffness: 300 }}
                className="absolute top-16 right-4 sm:right-6 border border-gray-200 rounded-2xl shadow-2xl z-50 px-2 py-2 min-w-[200px] max-w-[280px] bg-white"
                style={{
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
                }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-2">
                  {user ? (
                    // Logged in menu items
                    [
                      { label: 'AI Assistant', action: () => navigate('/chat') },
                      { label: 'Browse Properties', action: () => navigate('/properties') },
                      { label: 'Saved Properties', action: () => navigate('/saved') },
                      { label: 'Profile', action: () => navigate('/profile') },
                      { label: 'Logout', action: handleLogout, className: 'text-red-600 hover:text-red-700 hover:bg-red-50' }
                    ].map((item, idx) => (
                      <motion.button
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ x: 4, backgroundColor: item.className?.includes('red') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(44, 62, 80, 0.05)', scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={item.action}
                        className={`w-full text-left text-gray-700 hover:text-[#2C3E50] hover:bg-gray-100 p-3 rounded-lg text-sm cursor-pointer transition-all duration-200 ${item.className || ''}`}
                      >
                        {item.label}
                      </motion.button>
                    ))
                  ) : (
                    // Not logged in menu items
                    [
                      { label: 'Home', action: () => navigate('/') },
                      { label: 'Browse Properties', action: () => navigate('/listings') },
                      { label: 'About', action: () => navigate('/about') },
                      { label: 'Contact', action: () => navigate('/contact') },
                      { label: 'Login', action: () => navigate('/login') },
                      { label: 'Sign Up', action: () => navigate('/signup') }
                    ].map((item, idx) => (
                      <motion.button
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ x: 4, backgroundColor: 'rgba(44, 62, 80, 0.05)', scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={item.action}
                        className="w-full text-left text-gray-700 hover:text-[#2C3E50] hover:bg-gray-100 p-3 rounded-lg text-sm cursor-pointer transition-all duration-200"
                      >
                        {item.label}
                      </motion.button>
                    ))
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>

        {/* Profile Popup - Positioned relative to the navbar */}
        <ProfilePopup
          isOpen={showProfilePopup}
          onClose={() => setShowProfilePopup(false)}
          position="navbar"
          onAvatarUpdate={(newAvatarUrl) => {
            console.log('🔄 ChatPage - Avatar update received:', newAvatarUrl);
            setUserAvatar(newAvatarUrl);
            // Force re-render by updating a timestamp
            setUserAvatar(prev => {
              console.log('🔄 ChatPage - Setting new avatar:', prev !== newAvatarUrl ? newAvatarUrl : prev);
              return newAvatarUrl;
            });
          }}
        />
      </div>

      {/* MAIN area (hero + search) */}
      <div style={{ paddingLeft: isDesktop ? (compactMode ? '80px' : '320px') : 0 }} className="relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 pt-32 sm:pt-24">
          {/* Personalized welcome for logged-in users */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 sm:mb-8 max-w-2xl"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
                {greeting}, {getUserDisplayName()}! {showHolidayIcon && '✨'}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">{message}</p>
            </motion.div>
          )}


          {/* Search + upload area */}
          <div className="w-full max-w-3xl relative px-0 sm:px-2">
            <AnimatePresence>
              {(uploadedFiles.length > 0 || uploadedImages.length > 0) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="mb-2">
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadedFiles.map((file, idx) => (
                        <motion.div key={idx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25, delay: idx * 0.05 }} className="flex items-center bg-gray-100 text-[#2C3E50] px-2 py-1 rounded-lg text-xs">
                          <span className="mr-2 cursor-pointer underline" onClick={() => handlePreviewItem({ type: 'file', file })}>{file.name}</span>
                          <motion.button whileHover={{ scale: 1.1 }} type="button" className="ml-1 text-red-600 hover:text-red-700 text-xs px-1" onClick={() => handleRemoveFile(idx)}>
                            <span className="text-lg font-bold">×</span>
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadedImages.map((img, idx) => (
                        <motion.div key={idx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25, delay: idx * 0.05 }} className="flex items-center bg-gray-100 text-[#2C3E50] px-2 py-1 rounded-lg text-xs">
                          <img src={URL.createObjectURL(img)} alt={img.name} className="w-8 h-8 object-cover rounded mr-2 cursor-pointer" onClick={() => handlePreviewItem({ type: 'image', file: img })} />
                          <span className="mr-2 cursor-pointer underline" onClick={() => handlePreviewItem({ type: 'image', file: img })}>{img.name}</span>
                          <motion.button whileHover={{ scale: 1.1 }} type="button" className="ml-1 text-red-600 hover:text-red-700 text-xs px-1" onClick={() => handleRemoveImage(idx)}>
                            <span className="text-lg font-bold">×</span>
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              onSubmit={handleIntelligentSearchSubmit}
              whileHover={{ scale: 1.005 }}
              className={`relative flex flex-col bg-white/95 shadow-2xl px-0 py-3 sm:py-6 min-h-[120px] sm:min-h-[140px] backdrop-blur-sm z-20 ${showAdvancedSearch || showSuggestions ? 'rounded-[2rem]' : 'rounded-[2rem]'}`}
              style={{
                boxShadow: showAdvancedSearch || showSuggestions ? `
                  -2px 0 20px rgba(255, 107, 53, 0.2),
                  2px 0 20px rgba(255, 107, 53, 0.2),
                  0 -2px 20px rgba(255, 107, 53, 0.2),
                  -2px 0 40px rgba(255, 107, 53, 0.1),
                  2px 0 40px rgba(255, 107, 53, 0.1),
                  0 -2px 40px rgba(255, 107, 53, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                ` : `
                  0 0 20px rgba(255, 107, 53, 0.2),
                  0 0 40px rgba(255, 107, 53, 0.1),
                  0 0 60px rgba(255, 107, 53, 0.05),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)'
              }}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(255, 107, 53, 0.2)",
                    "0 0 30px rgba(255, 107, 53, 0.3)",
                    "0 0 20px rgba(255, 107, 53, 0.2)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 pointer-events-none ${showAdvancedSearch || showSuggestions ? 'rounded-[2rem]' : 'rounded-[2rem]'}`}
                style={{
                  background: 'radial-gradient(circle at center, rgba(255, 107, 53, 0.1) 0%, transparent 70%)'
                }}
              />

              <div className="relative">
                <div className="relative w-full">
                  <motion.input
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    type="text"
                    value={searchQuery}
                    onChange={handleIntelligentSearchChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleIntelligentSearchSubmit(e)}
                    onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search for apartments, houses, locations... (e.g., '2 bedroom apartment in Lekki under ₦1M')"
                    className={`w-full bg-transparent text-[#2C3E50] placeholder-gray-400 outline-none border-none h-12 sm:h-16 px-6 pr-16 relative z-10 ${showAdvancedSearch || showSuggestions ? 'rounded-xl sm:rounded-2xl' : 'rounded-xl sm:rounded-2xl'}`}
                    style={{
                      minWidth: 0,
                      fontSize: '0.95rem',
                      lineHeight: '0.9',
                      verticalAlign: 'top',
                      marginTop: '-2px',
                      marginBottom: 0,
                      paddingTop: '20px',
                      paddingBottom: '2px'
                    }}
                    autoComplete="off"
                    aria-label="Intelligent property search"
                    disabled={isSearching}
                  />
                  {searchError && (
                    <div className="absolute bottom-0 left-0 right-0 text-red-600 text-xs mt-1">
                      {searchError}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6 w-auto">
                <div className="flex items-center gap-2 sm:gap-3 relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-[#2C3E50] border border-gray-300"
                    tabIndex={-1}
                    onClick={() => setShowPlusDropdown((s) => !s)}
                    title="Upload files or images"
                  >
                    <Plus size={10} />
                  </motion.button>

                  <AnimatePresence>
                    {showPlusDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute bottom-12 left-0 border border-gray-200 rounded-lg shadow-2xl z-50 px-1 py-0.5 min-w-[180px] w-[180px] h-[60px] bg-white"
                      >
                        <div className="space-y-0">
                          <button
                            onClick={() => { handleFileUploadClick(); setShowPlusDropdown(false); }}
                            className="w-full flex items-center gap-0.5 text-left text-gray-700 hover:text-[#2C3E50] hover:bg-gray-100 px-1.5 py-0.5 rounded text-[10px] leading-tight"
                          >
                            <FileUp size={8} className="flex-shrink-0" />
                            <span className="truncate">Upload File</span>
                          </button>
                          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

                          <button
                            onClick={() => { handleImageUploadClick(); setShowPlusDropdown(false); }}
                            className="w-full flex items-center gap-0.5 text-left text-gray-700 hover:text-[#2C3E50] hover:bg-gray-100 px-1.5 py-0.5 rounded text-[10px] leading-tight"
                          >
                            <ImageUp size={8} className="flex-shrink-0" />
                            <span className="truncate">Upload Image</span>
                          </button>
                          <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="flex items-center gap-1 px-2 py-1 sm:px-2 sm:py-1 rounded-full bg-transparent border border-gray-300 text-[#2C3E50] font-small hover:bg-gray-100 text-xs"
                    title="Advanced search options"
                  >
                    <SlidersHorizontal size={14} />
                    <span>Advanced</span>
                  </motion.button>

                  {/* Quick Search Examples */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                    <span>Try:</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('2 bedroom apartment in Lekki')}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                    >
                      2BR Lekki
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('house with parking in Abuja')}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                    >
                      Abuja house
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-white shadow-lg ${!searchQuery.trim() ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-[#FF6B35] hover:bg-[#e85e2f]'}`}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  disabled={!searchQuery.trim() || isSearching}
                  title="Search properties"
                >
                  {isSearching ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ArrowUp size={14} />
                  )}
                </motion.button>
              </div>
            </motion.form>

            {/* Advanced Search Panel - Full Width Extension */}
            <AnimatePresence>
              {showAdvancedSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute top-full left-2 right-2 bg-white/95 backdrop-blur-md rounded-b-[2rem] shadow-2xl border-l border-r border-b border-gray-200/80 z-10 overflow-hidden"
                  style={{
                    boxShadow: `
                      0 10px 25px rgba(0, 0, 0, 0.15),
                      0 4px 10px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)'
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-[#2C3E50]">Advanced Search Filters</h3>
                      <button
                        onClick={() => setShowAdvancedSearch(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X size={18} className="text-gray-500" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Location Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <MapPin size={16} className="text-blue-600" />
                          </div>
                          <label className="text-sm font-medium text-gray-700">Where</label>
                        </div>
                        <input
                          type="text"
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          placeholder="Enter location..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        {locationSuggestions.length > 0 && (
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {locationSuggestions.slice(0, 4).map((location, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSearchLocation(location);
                                  setLocationSuggestions([]);
                                }}
                                className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                              >
                                📍 {location}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Property Type Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Home size={16} className="text-green-600" />
                          </div>
                          <label className="text-sm font-medium text-gray-700">Property Type</label>
                        </div>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        >
                          <option value="">Any Type</option>
                          <option value="apartment">Apartment</option>
                          <option value="house">House</option>
                          <option value="duplex">Duplex</option>
                          <option value="bungalow">Bungalow</option>
                          <option value="penthouse">Penthouse</option>
                          <option value="studio">Studio</option>
                          <option value="self-contain">Self Contain</option>
                        </select>
                      </div>

                      {/* Price Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <DollarSign size={16} className="text-purple-600" />
                          </div>
                          <label className="text-sm font-medium text-gray-700">Price Range</label>
                        </div>
                        <select
                          value={`${priceRange[0]}-${priceRange[1]}`}
                          onChange={(e) => {
                            const [min, max] = e.target.value.split('-').map(Number);
                            setPriceRange([min || 0, max || 10000000]);
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        >
                          <option value="0-10000000">Any Price</option>
                          <option value="0-300000">Under ₦300K</option>
                          <option value="300000-500000">₦300K - ₦500K</option>
                          <option value="500000-1000000">₦500K - ₦1M</option>
                          <option value="1000000-2000000">₦1M - ₦2M</option>
                          <option value="2000000-5000000">₦2M - ₦5M</option>
                          <option value="5000000-10000000">Over ₦5M</option>
                        </select>
                      </div>

                      {/* Purchase Type Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <ShoppingCart size={16} className="text-orange-600" />
                          </div>
                          <label className="text-sm font-medium text-gray-700">Purchase Type</label>
                        </div>
                        <select
                          value={purchaseType}
                          onChange={(e) => setPurchaseType(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        >
                          <option value="">Any</option>
                          <option value="rent">Rent</option>
                          <option value="buy">Buy</option>
                          <option value="lease">Lease</option>
                          <option value="shortlet">Short Let</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSearchLocation('');
                          setPropertyType('');
                          setPriceRange([0, 10000000]);
                          setPurchaseType('');
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        Clear Filters
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAdvancedSearch(false)}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            // Apply filters and search
                            handleIntelligentSearchSubmit({ preventDefault: () => {} });
                            setShowAdvancedSearch(false);
                          }}
                          className="px-4 py-2 text-sm bg-[#FF6B35] text-white hover:bg-[#e85e2f] rounded-lg transition-colors shadow-sm"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute top-full left-2 right-2 border-l border-r border-b border-gray-200/80 rounded-b-[2rem] shadow-2xl z-10 overflow-hidden bg-white/95 backdrop-blur-md"
                  style={{
                    boxShadow: `
                      0 10px 25px rgba(0, 0, 0, 0.15),
                      0 4px 10px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)'
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#2C3E50]">🔍 Intelligent Suggestions</h3>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>  

                    {/* Property Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Home size={14} className="text-gray-600" />
                          Top Property Matches
                        </h4>
                        <div className="space-y-3">
                          {suggestions.slice(0, 4).map((suggestion, idx) => (
                            <motion.button
                              key={suggestion.id || idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              whileHover={{
                                scale: 1.02,
                                backgroundColor: "rgba(255, 107, 53, 0.05)",
                                borderColor: "#FF6B35"
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleIntelligentSuggestionSelect(suggestion)}
                              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 text-left border border-gray-100 hover:border-[#FF6B35]/30 group"
                            >
                              <div className="relative">
                                {suggestion.images && suggestion.images[0] ? (
                                  <img
                                    src={suggestion.images[0]}
                                    alt={suggestion.title}
                                    className="w-16 h-16 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                                    <Home size={20} className="text-gray-500" />
                                  </div>
                                )}
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center">
                                  <motion.span
                                    animate={{
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 10, -10, 0]
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                    className="text-white text-xs font-bold"
                                  >
                                    {suggestion.relevance > 8 ? '🔥' : suggestion.relevance > 5 ? '👍' : '📍'}
                                  </motion.span>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate mb-1">
                                  {suggestion.title}
                                </div>
                                <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                                  <motion.div
                                    animate={{ rotate: [0, 6, -6, 0] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                                  >
                                    <MapPin size={12} className="text-gray-500" />
                                  </motion.div>
                                  {suggestion.location} •
                                  <motion.div
                                    animate={{
                                      scale: [1, 1.15, 1],
                                      rotate: [0, 3, -3, 0]
                                    }}
                                    transition={{
                                      duration: 2.0,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  >
                                    <DollarSign size={12} className="text-gray-500" />
                                  </motion.div>
                                  ₦{suggestion.price?.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  {suggestion.bedrooms && (
                                    <span className="flex items-center gap-1">
                                      <motion.div
                                        animate={{
                                          y: [0, -2, 0],
                                          scale: [1, 1.05, 1]
                                        }}
                                        transition={{
                                          duration: 1.8,
                                          repeat: Infinity,
                                          ease: "easeInOut"
                                        }}
                                      >
                                        <Bed size={10} className="text-gray-500" />
                                      </motion.div>
                                      {suggestion.bedrooms}BR
                                    </span>
                                  )}
                                  {suggestion.bathrooms && (
                                    <span className="flex items-center gap-1">
                                      <motion.div
                                        animate={{
                                          scale: [1, 1.18, 1],
                                          rotate: [0, 2, -2, 0]
                                        }}
                                        transition={{
                                          duration: 2.0,
                                          repeat: Infinity,
                                          ease: "easeInOut"
                                        }}
                                      >
                                        <Bath size={10} className="text-gray-500" />
                                      </motion.div>
                                      {suggestion.bathrooms}BA
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-full ${
                                    suggestion.relevance > 8 ? 'bg-green-100 text-green-700' :
                                    suggestion.relevance > 5 ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {suggestion.relevance > 8 ? 'Excellent Match' :
                                     suggestion.relevance > 5 ? 'Good Match' : 'Fair Match'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-gray-500 mb-1">Relevance</div>
                                <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      suggestion.relevance > 8 ? 'bg-green-500' :
                                      suggestion.relevance > 5 ? 'bg-blue-500' :
                                      'bg-gray-400'
                                    }`}
                                    style={{ width: `${Math.min(suggestion.relevance * 10, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Location Suggestions */}
                    {locationSuggestions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <MapPin size={14} className="text-gray-600" />
                          Popular Locations
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {locationSuggestions.slice(0, 6).map((location, idx) => (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ scale: 1.05, backgroundColor: "#FF6B35" }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSearchQuery(prev => prev + ` in ${location}`);
                                setLocationSuggestions([]);
                                setShowSuggestions(false);
                              }}
                              className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#FF6B35] hover:to-[#e85e2f] text-gray-700 hover:text-white rounded-lg text-xs font-medium transition-all duration-200 border border-gray-200 hover:border-[#FF6B35] flex items-center gap-2"
                            >
                              <motion.div
                                animate={{
                                  rotate: [0, 8, -8, 0],
                                  scale: [1, 1.1, 1]
                                }}
                                transition={{
                                  duration: 2.3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <MapPin size={12} />
                              </motion.div>
                              {location}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Clock size={14} className="text-gray-600" />
                          Recent Searches
                        </h4>
                        <div className="space-y-2">
                          {searchHistory.slice(0, 3).map((query, idx) => (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ x: 4, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                              onClick={() => {
                                setSearchQuery(query);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-100 hover:border-blue-200 flex items-center gap-2"
                            >
                              <motion.div
                                animate={{
                                  scale: [1, 1.25, 1],
                                  rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                  duration: 1.8,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <Search size={10} className="text-blue-600" />
                              </motion.div>
                              {query.length > 25 ? query.substring(0, 25) + '...' : query}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <TrendingUp size={14} className="text-gray-600" />
                          Trending Now
                        </h4>
                        <div className="space-y-2">
                          {popularSearches.slice(0, 3).map((query, idx) => (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ x: 4, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                              onClick={() => {
                                setSearchQuery(query);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all duration-200 border border-emerald-100 hover:border-emerald-200 flex items-center gap-2"
                            >
                              <motion.div
                                animate={{
                                  scale: [1, 1.4, 1],
                                  rotate: [0, 8, -8, 0],
                                  y: [0, -2, 0]
                                }}
                                transition={{
                                  duration: 2.2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <Flame size={10} className="text-emerald-600" />
                              </motion.div>
                              {query.length > 25 ? query.substring(0, 25) + '...' : query}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* preview modal */}
        <AnimatePresence>
          {previewItem && (
            <motion.div ref={previewDropdownRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.18 }} className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col items-center justify-center bg-white" style={{ width: '70vw', height: '70vh', maxWidth: '900px', maxHeight: '900px', overflow: 'hidden', boxSizing: 'border-box' }}>
              <div className="flex items-center justify-between w-full px-6 pt-4">
                <div className="text-[#2C3E50] font-bold text-lg truncate">{previewItem.file?.name}</div>
                <div className="flex items-center gap-2">
                  <button onClick={closePreview} className="p-1 rounded hover:bg-gray-100"><X size={18} className="text-gray-600" /></button>
                </div>
              </div>

              <div className="flex-1 w-full px-6 py-4 overflow-auto flex items-start justify-center">
                {previewItem.type === 'image' ? (
                  <img src={previewURL} alt={previewItem.file.name} className="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain" />
                ) : previewItem.file?.type === 'application/pdf' ? (
                  <object data={previewURL} type="application/pdf" className="w-full h-[60vh] rounded-lg shadow-lg bg-white">
                    <div className="text-gray-600 text-lg mb-4">PDF preview not available in this browser.</div>
                    <a href={previewURL} download={previewItem.file?.name} className="px-4 py-2 bg-gray-200 text-[#2C3E50] rounded-lg shadow hover:bg-gray-300">Download PDF</a>
                  </object>
                ) : previewItem.isDocxType ? (
                  <div className="text-center">
                    <div className="text-gray-600 text-lg mb-4">DOCX preview not supported. You can download the file below.</div>
                    <a href={previewURL} download={previewItem.file?.name} className="px-4 py-2 bg-gray-200 text-[#2C3E50] rounded-lg shadow hover:bg-gray-300">Download DOCX</a>
                  </div>
                ) : previewItem.fileText ? (
                  <div className="w-full h-[60vh] overflow-auto bg-gray-50 text-[#2C3E50] p-4 rounded-lg shadow-lg" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{previewItem.fileText}</div>
                ) : (
                  <div className="text-gray-600 text-lg">File preview not available for this type.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
  }
