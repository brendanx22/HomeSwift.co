import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import ProfilePopup from '../components/ProfilePopup';

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
  TrendingUp
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
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
      // Navigate to the results page with the query
      const searchParams = new URLSearchParams({ search: query });
      if (searchLocation) searchParams.set('location', searchLocation);
      if (propertyType) searchParams.set('type', propertyType);
      navigate(`/browse?${searchParams.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounced suggestions
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchError(null);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      setShowSuggestions(true);
      
      // Debounce suggestions loading
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Get search suggestions from properties table
          const { data: suggestions, error } = await supabase
            .from('properties')
            .select('title, location')
            .or(`title.ilike.%${value}%,location.ilike.%${value}%`)
            .limit(5);
          
          if (!error) {
            setSuggestions(suggestions || []);
          }
        } catch (error) {
          console.error('Failed to load suggestions:', error);
          setSuggestions([]);
        }
      }, 300);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
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
    // Trigger search with the selected suggestion
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
                    { icon: Camera, label: 'Virtual Tours', active: location.pathname === '/virtual-tours' },
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
          {/* hero text */}
          <div className="text-center mb-8 sm:mb-10 max-w-4xl px-2 sm:px-0">
            <h1 className="flex items-center justify-center flex-wrap text-3xl sm:text-4xl font-bold text-[#2C3E50] mb-4 sm:mb-5 leading-tight gap-2 sm:gap-3">
              <span>AI-Powered Property Search</span>
              <span className="inline-flex items-center"><img src="/images/logo.png" alt="logo" className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg object-cover" /></span>
            </h1>
            <p className="text-gray-600 text-md md:text-lg font-light max-w-2xl mx-auto">Ask me anything about properties, neighborhoods, or market trends. I'm your AI real estate assistant!</p>
          </div>

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
              onSubmit={handleSearchSubmit}
              whileHover={{ scale: 1.005 }}
              className="relative flex flex-col bg-white/95 border border-gray-300 rounded-3xl shadow-2xl px-0 py-6 sm:px-4 sm:py-10 min-h-[120px] backdrop-blur-sm"
              style={{
                boxShadow: `
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
                className="absolute inset-0 rounded-3xl pointer-events-none"
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
                    onChange={handleSearchChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                    onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search by location, type, or features..."
                    className="w-full bg-transparent text-[#2C3E50] placeholder-gray-400 outline-none border-none h-14 sm:h-16 rounded-xl sm:rounded-2xl px-6 pr-16 relative z-10"
                    style={{
                      minWidth: 0,
                      fontSize: '0.95rem',
                      lineHeight: '0.9',
                      verticalAlign: 'top',
                      marginTop: '-8px',
                      marginBottom: 0,
                      paddingTop: '28px',
                      paddingBottom: '2px'
                    }}
                    autoComplete="off"
                    aria-label="Search properties"
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
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-[#2C3E50] border border-gray-300" tabIndex={-1} onClick={() => setShowPlusDropdown((s) => !s)}>
                    <Plus size={10} />
                  </motion.button>

                  <AnimatePresence>
                    {showPlusDropdown && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.18 }} className="absolute bottom-12 left-0 border border-gray-200 rounded-lg shadow-2xl z-50 px-1 py-0.5 min-w-[180px] w-[180px] h-[60px] bg-white">
                        <div className="space-y-0">
                          <button onClick={() => { handleFileUploadClick(); setShowPlusDropdown(false); }} className="w-full flex items-center gap-0.5 text-left text-gray-700 hover:text-[#2C3E50] hover:bg-gray-100 px-1.5 py-0.5 rounded text-[10px] leading-tight">
                            <FileUp size={8} className="flex-shrink-0" />
                            <span className="truncate">Upload File</span>
                          </button>
                          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

                          <button onClick={() => { handleImageUploadClick(); setShowPlusDropdown(false); }} className="w-full flex items-center gap-0.5 text-left text-gray-700 hover:text-[#2C3E50] hover:bg-gray-100 px-1.5 py-0.5 rounded text-[10px] leading-tight">
                            <ImageUp size={8} className="flex-shrink-0" />
                            <span className="truncate">Upload Image</span>
                          </button>
                          <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={handleSuggestionClick} className="flex items-center gap-1 px-2 py-1 sm:px-2 sm:py-1 rounded-full bg-transparent border border-gray-300 text-[#2C3E50] font-small hover:bg-gray-100 text-xs">
                    <Sparkles size={14} />
                    <span>Suggestions</span>
                  </motion.button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  type="submit" 
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-white shadow-lg ${!searchQuery.trim() ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-[#FF6B35] hover:bg-[#e85e2f]'}`} 
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} 
                  disabled={!searchQuery.trim() || isSearching}
                >
                  <ArrowUp size={14} />
                </motion.button>
              </div>
            </motion.form>
            
            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.2 }} className="absolute top-full left-0 right-0 mt-2 sm:mt-4 border border-gray-200 rounded-2xl shadow-2xl z-20 overflow-hidden bg-white">
                  <div className="p-4">
                    <h3 className="text-[#FF6B35] font-semibold mb-3 sm:mb-4 text-lg sm:text-xl">Popular Searches</h3>
                    <div className="space-y-1">
                      {suggestions.map((sug, idx) => (
                        <motion.button 
                          key={idx} 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSuggestionSelect(sug)} 
                          className="w-full text-left text-gray-700 hover:text-[#2C3E50] hover:bg-gray-100 px-4 py-2.5 rounded-lg leading-normal transition-all duration-150"
                          style={{ fontSize: '15px' }}
                        >
                          {sug.title} {sug.location && `- ${sug.location}`}
                        </motion.button>
                      ))}
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
