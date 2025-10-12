import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
  LogOut
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

    // Try to get first name from the user object (camelCase or snake_case)
    let firstName = user.firstName || user.first_name || 
                   user.user_metadata?.firstName || user.user_metadata?.first_name ||
                   user.name?.split(' ')[0] || 
                   user.displayName?.split(' ')[0] ||
                   user.email?.split('@')[0] || 
                   'User';
    
    // If we have a full name, extract just the first name
    if (user.full_name) {
      firstName = user.full_name.split(' ')[0];
    }
    
    // Format the first name (capitalize first letter of each word)
    return firstName
      .replace(/\./g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, [user]);
  
  // UI state
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  
  // Handle sending search query
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35] mb-4"></div>
        <p className="text-gray-600">Loading your session...</p>
      </div>
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
    { id: 'properties', label: 'Browse Homes', icon: <Home className="w-5 h-5" /> },
    { id: 'search', label: 'Property Search', icon: <SearchIcon className="w-5 h-5" /> },
    { id: 'saved', label: 'Saved Properties', icon: <Heart className="w-5 h-5" /> },
    { id: 'neighborhoods', label: 'Neighborhood Guide', icon: <MapPin className="w-5 h-5" /> },
    { id: 'calculator', label: 'Mortgage Calculator', icon: <Calculator className="w-5 h-5" /> },
    { id: 'tours', label: 'Virtual Tours', icon: <Camera className="w-5 h-5" /> },
    { id: 'filters', label: 'Advanced Filters', icon: <Filter className="w-5 h-5" /> },
    { id: 'recent', label: 'Recent Searches', icon: <Clock className="w-5 h-5" /> },
  ];

  // Handle navigation to different sections
  const handleNavigation = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
    
    // Handle navigation based on the selected item
    switch(id) {
      case 'search':
        navigate('/properties');
        break;
      case 'properties':
        navigate('/properties');
        break;
      case 'saved':
        navigate(`${isChat ? '' : '/app'}/saved`);
        break;
      case 'neighborhoods':
        navigate(`${isChat ? '' : '/app'}/neighborhoods`);
        break;
      case 'calculator':
        navigate(`${isChat ? '' : '/app'}/calculator`);
        break;
      case 'tours':
        navigate(`${isChat ? '' : '/app'}/tours`);
        break;
      case 'filters':
        navigate(`${isChat ? '' : '/app'}/filters`);
        break;
      case 'recent':
        navigate(`${isChat ? '' : '/app'}/recent`);
        break;
      default:
        // For other items, just update the active tab
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
        const redirectTarget = `${window.location.origin}/properties?${searchParams.toString()}`;
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
      navigate(`/properties?${searchParams.toString()}`);
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
            .or([
              { title: { ilike: `%${value}%` } },
              { location: { ilike: `%${value}%` } },
            ])
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

  // Property search handler
  const handleSearch = () => {
    // Handle property search logic here
    console.log('Searching for:', { location: searchLocation, type: propertyType });
    setShowPlusDropdown(false);
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
    setSearchQuery(suggestion.value || suggestion.text);
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
      className={`${showSuggestions ? 'min-h-[140vh]' : 'min-h-screen'} relative`}
    >
      {/* overlays to darken the hero */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-700/20 via-transparent to-transparent" />

      {/* Left floating open-button (small screens) */}
      {/* Mobile toggle - single oval container */}
      {!isDesktop && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="fixed left-4 top-4 z-30 sm:hidden"
        >
          <div className="flex items-center p-1 rounded-full backdrop-blur-sm border border-white/20 bg-transparent">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileSidebar(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Open chat"
            >
              <MessageSquare className="text-white" size={18} />
            </motion.button>
            
            <div className="w-px h-5 bg-white/20 mx-1"></div>
            
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { /* Add your plus button action here */ }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Add new"
            >
              <Plus className="text-white" size={18} />
            </motion.button>
          </div>
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
              className={`fixed left-0 top-0 z-50 h-full backdrop-blur-xl flex flex-col border-r border-gray-800/50 ${compactMode ? 'w-16' : 'w-64'}`}
              style={{ 
                background: 'rgba(15, 15, 15, 0.95)',
                boxShadow: '2px 0 10px rgba(0, 0, 0, 0.2)'
              }}
            >
              {/* HomeSwift sidebar header */}
              <div className="p-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-12 mt-8">
                  <div className="flex items-center gap-2">
                    {compactMode ? (
                      <div className="flex justify-center w-full">
                        <img src="/Group 129.png" alt="HomeSwift Logo" className="w-10 h-10 rounded-lg object-cover" />
                      </div>
                    ) : (
                      <>
                        <img src="/Group 129.png" alt="HomeSwift Logo" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-white font-semibold text-lg">HomeSwift</span>
                      </>
                    )}
                  </div>

                  {!compactMode && (
                    <div className="flex items-center gap-1">
                      {!isDesktop ? (
                        <button 
                          onClick={() => setShowMobileSidebar(false)} 
                          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
                        >
                          <X size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setCompactMode((s) => !s)}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
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
                      className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
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
                    { icon: Home, label: 'Home', active: true },
                    { icon: MapPin, label: 'Find Properties' },
                    { icon: Heart, label: 'Saved Properties' },
                    { icon: MapPin, label: 'Neighborhood Guide' },
                    { icon: Calculator, label: 'Mortgage Calculator' },
                    { icon: Camera, label: 'Virtual Tours' },
                    { icon: Filter, label: 'Advanced Filters' },
                    { icon: Clock, label: 'Recent Searches' }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, delay: idx * 0.05 }}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                        item.active 
                          ? 'bg-gray-800/80 text-white' 
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                      }`}
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
                  <div className="mt-6 px-1">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent</h3>
                    <div className="space-y-1">
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
                          className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            activeChat === chat.id 
                              ? 'bg-gray-800/80 text-white' 
                              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
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
                                className="p-1 rounded hover:bg-gray-700/50 transition-colors duration-200"
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
              <div className="p-3 border-t border-gray-800/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  {!compactMode && (
                    <div className="flex items-center gap-2">
                      {user ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                              {getUserDisplayName().charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-gray-100 text-sm font-medium truncate">
                              {getUserDisplayName()}
                            </span>
                            <span className="text-gray-400 text-xs truncate">
                              {user?.email}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                            <User size={12} className="text-gray-300" />
                          </div>
                          <span className="text-gray-400 text-sm">Not logged in</span>
                        </>
                      )}
                    </div>
                  )}
                  {user && (
                    <button 
                      onClick={handleLogout}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-red-400 transition-all duration-200"
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top Nav */}
      <motion.nav className="relative z-10 flex items-center justify-end p-4 sm:p-6 w-full">
        {/* User Profile - Avatar Only */}
        <div className="flex items-center">
          {user ? (
            <div className="flex items-center">
              <div className="hidden sm:flex sm:flex-col sm:items-end mr-3">
                <span className="text-sm font-medium text-white">{getUserDisplayName()}</span>
                <span className="text-xs text-gray-400">{user?.email}</span>
              </div>
              <button 
                onClick={() => setShowMenu((s) => !s)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200"
                aria-label="User menu"
              >
                {getUserDisplayName().charAt(0).toUpperCase()}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }} 
              transition={{ duration: 0.18 }} 
              className="absolute top-16 right-4 sm:right-6 border border-gray-400/50 rounded-2xl shadow-2xl z-50 px-2 py-2 min-w-[260px] backdrop-blur-xl" 
              style={{ background: 'rgba(60, 60, 60, 0.85)' }}
            >
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-2">
                {user ? (
                  // Logged in menu items
                  [
                    { label: 'Dashboard', action: () => navigate('/main') },
                    { label: 'Browse Properties', action: () => navigate('/listings') },
                    { label: 'Saved Properties', action: () => navigate('/saved') },
                    { label: 'Profile', action: () => navigate('/profile') },
                    { label: 'Logout', action: handleLogout, className: 'text-red-400 hover:text-red-300' }
                  ].map((item, idx) => (
                    <motion.button 
                      key={idx} 
                      variants={itemVariants} 
                      whileHover={{ x: 6 }} 
                      onClick={item.action}
                      className={`w-full text-left text-gray-300 hover:text-white hover:bg-gray-700/50 p-3 rounded-lg text-sm cursor-pointer transition-all duration-200 ${item.className || ''}`}
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
                      whileHover={{ x: 6 }} 
                      onClick={item.action}
                      className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-700/50 p-3 rounded-lg text-sm cursor-pointer transition-all duration-200"
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

      {/* MAIN area (hero + search) */}
      <div style={{ paddingLeft: isDesktop ? (compactMode ? '80px' : '320px') : 0 }} className="relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 pt-32 sm:pt-24">
          {/* hero text */}
          <div className="text-center mb-8 sm:mb-10 max-w-4xl px-2 sm:px-0">
            <h1 className="flex items-center justify-center flex-wrap text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-5 leading-tight gap-2 sm:gap-3">
              <span>Welcome back, {getUserDisplayName()}!</span>
              <span className="inline-flex items-center"><img src="/Group 129.png" alt="logo" className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg object-cover" /></span>
            </h1>
            <p className="text-gray-300 text-md md:text-lg font-light max-w-2xl mx-auto">Find your dream home with HomeSwift's AI-powered search</p>
          </div>

          {/* Search + upload area */}
          <div className="w-full max-w-3xl relative px-0 sm:px-2">
            <AnimatePresence>
              {(uploadedFiles.length > 0 || uploadedImages.length > 0) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="mb-2">
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadedFiles.map((file, idx) => (
                        <motion.div key={idx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25, delay: idx * 0.05 }} className="flex items-center bg-gray-700/30 text-gray-200 px-2 py-1 rounded-lg text-xs">
                          <span className="mr-2 cursor-pointer underline" onClick={() => handlePreviewItem({ type: 'file', file })}>{file.name}</span>
                          <motion.button whileHover={{ scale: 1.1 }} type="button" className="ml-1 text-red-400 hover:text-red-600 text-xs px-1" onClick={() => handleRemoveFile(idx)}>
                            <span className="text-lg font-bold">×</span>
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {uploadedImages.map((img, idx) => (
                        <motion.div key={idx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25, delay: idx * 0.05 }} className="flex items-center bg-gray-700/30 text-gray-200 px-2 py-1 rounded-lg text-xs">
                          <img src={URL.createObjectURL(img)} alt={img.name} className="w-8 h-8 object-cover rounded mr-2 cursor-pointer" onClick={() => handlePreviewItem({ type: 'image', file: img })} />
                          <span className="mr-2 cursor-pointer underline" onClick={() => handlePreviewItem({ type: 'image', file: img })}>{img.name}</span>
                          <motion.button whileHover={{ scale: 1.1 }} type="button" className="ml-1 text-red-400 hover:text-red-600 text-xs px-1" onClick={() => handleRemoveImage(idx)}>
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
              className="relative flex flex-col bg-transparent border  border-[#6c6c6c] rounded-3xl shadow-2xl px-0 py-6 sm:px-4 sm:py-10 min-h-[120px] backdrop-blur-xl" 
              style={{ background: 'rgba(60, 60, 60, 0.15)' }}
            >
              <div className="relative">
                <div className="relative w-full flex items-center">
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={handleSearchChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                    onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search by location, type, or features..." 
                    className="w-full bg-transparent text-white placeholder-[#737373] outline-none border-none h-14 sm:h-16 rounded-xl sm:rounded-2xl px-6 pr-16 pt-2 pb-1" 
                    style={{ 
                      minWidth: 0, 
                      fontSize: '1.1rem', 
                      lineHeight: '1.2'
                    }}
                    autoComplete="off"
                    aria-label="Search properties"
                    disabled={isSearching}
                  />
                  {searchError && (
                    <div className="absolute bottom-0 left-0 right-0 text-red-400 text-xs mt-1">
                      {searchError}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 w-auto">
                <div className="flex items-center gap-2 sm:gap-3 relative">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-gray-700/40 hover:bg-gray-600/50 text-gray-300 border border-gray-500" tabIndex={-1} onClick={() => setShowPlusDropdown((s) => !s)}>
                    <Plus size={12} />
                  </motion.button>

                  <AnimatePresence>
                    {showPlusDropdown && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.18 }} className="absolute bottom-14 left-0 border border-gray-400/50 rounded-lg shadow-2xl z-50 px-1 py-0.5 min-w-[180px] w-[180px] h-[60px] backdrop-blur-xl" style={{ background: 'rgba(60, 60, 60, 0.9)' }}>
                        <div className="space-y-0">
                          <button onClick={() => { handleFileUploadClick(); setShowPlusDropdown(false); }} className="w-full flex items-center gap-0.5 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 px-1.5 py-0.5 rounded text-[10px] leading-tight">
                            <FileUp size={8} className="flex-shrink-0" />
                            <span className="truncate">Upload File</span>
                          </button>
                          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

                          <button onClick={() => { handleImageUploadClick(); setShowPlusDropdown(false); }} className="w-full flex items-center gap-0.5 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 px-1.5 py-0.5 rounded text-[10px] leading-tight">
                            <ImageUp size={8} className="flex-shrink-0" />
                            <span className="truncate">Upload Image</span>
                          </button>
                          <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={handleSuggestionClick} className="flex items-center gap-1 sm:gap-1 px-1 py-1 sm:px-3 sm:py-1 rounded-full bg-transparent border border-gray-400/50 text-gray-300 font-small hover:bg-gray-700/30 text-xs sm:text-base">
                    <Sparkles size={18} />
                    <span>Suggestions</span>
                  </motion.button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  type="submit" 
                  className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-white shadow-lg border border-gray-400/50 ${!searchQuery.trim() ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  style={{ background: 'linear-gradient(180deg, #3a3d42 0%, #23262b 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} 
                  disabled={!searchQuery.trim() || isSearching}
                >
                  <ArrowUp size={18} />
                </motion.button>
              </div>
            </motion.form>
            
            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.2 }} className="absolute top-full left-0 right-0 mt-2 sm:mt-4 border border-gray-400/50 rounded-2xl shadow-2xl z-20 overflow-hidden" style={{ backgroundImage: 'url("/Rectangle 135.png")', backgroundSize: 'cover', backgroundPosition: 'center', backdropFilter: 'blur(12px)' }}>
                  <div className="p-4" style={{ background: 'transparent' }}>
                    <h3 className="text-white font-semibold mb-3 sm:mb-4 text-lg sm:text-xl">Popular Searches</h3>
                    <div className="space-y-1">
                      {suggestions.map((sug, idx) => (
                        <motion.button 
                          key={idx} 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSuggestionSelect(sug)} 
                          className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-700/50 px-4 py-2.5 rounded-lg leading-normal transition-all duration-150"
                          style={{ fontSize: '15px' }}
                        >
                          {sug}
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
            <motion.div ref={previewDropdownRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.18 }} className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-400/50 rounded-2xl shadow-2xl z-50 flex flex-col items-center justify-center backdrop-blur-xl" style={{ background: 'rgba(60, 60, 60, 0.95)', width: '70vw', height: '70vh', maxWidth: '900px', maxHeight: '900px', overflow: 'hidden', boxSizing: 'border-box' }}>
              <div className="flex items-center justify-between w-full px-6 pt-4">
                <div className="text-gray-200 font-bold text-lg truncate">{previewItem.file?.name}</div>
                <div className="flex items-center gap-2">
                  <button onClick={closePreview} className="p-1 rounded hover:bg-gray-700/50"><X size={18} className="text-gray-300" /></button>
                </div>
              </div>

              <div className="flex-1 w-full px-6 py-4 overflow-auto flex items-start justify-center">
                {previewItem.type === 'image' ? (
                  <img src={previewURL} alt={previewItem.file.name} className="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain" />
                ) : previewItem.file?.type === 'application/pdf' ? (
                  <object data={previewURL} type="application/pdf" className="w-full h-[60vh] rounded-lg shadow-lg bg-white">
                    <div className="text-gray-400 text-lg mb-4">PDF preview not available in this browser.</div>
                    <a href={previewURL} download={previewItem.file?.name} className="px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800">Download PDF</a>
                  </object>
                ) : previewItem.isDocxType ? (
                  <div className="text-center">
                    <div className="text-gray-400 text-lg mb-4">DOCX preview not supported. You can download the file below.</div>
                    <a href={previewURL} download={previewItem.file?.name} className="px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800">Download DOCX</a>
                  </div>
                ) : previewItem.fileText ? (
                  <div className="w-full h-[60vh] overflow-auto bg-gray-900 text-gray-100 p-4 rounded-lg shadow-lg" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{previewItem.fileText}</div>
                ) : (
                  <div className="text-gray-400 text-lg">File preview not available for this type.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
  }
