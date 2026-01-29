import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Menu, X, Search, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown, MapPin, Bed, Bath, Ruler, Heart, Plus, Minus, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, Info, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useScroll } from 'framer-motion';
import { PropertyAPI } from '../lib/propertyAPI';

const Home = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [searchText, setSearchText] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  
  // Filter States
  const [locationQuery, setLocationQuery] = useState('');
  const [purchaseType, setPurchaseType] = useState(''); // 'for-rent', 'for-sale'
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState(null);
  
  // UI States
  const [activeDropdown, setActiveDropdown] = useState(null); // 'purchase', 'type', 'price'
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [heroActiveDropdown, setHeroActiveDropdown] = useState(null); // 'purchase', 'type', 'budget'
  const [heroLocation, setHeroLocation] = useState('');
  const [heroPurchase, setHeroPurchase] = useState('Add Purchase Type');
  const [heroType, setHeroType] = useState('Add Type');
  const [heroBudget, setHeroBudget] = useState('Select a price range');

  const fetchProperties = async (filters = {}) => {
    try {
      setLoadingProperties(true);
      const result = await PropertyAPI.searchProperties(filters);
      if (result.success) {
        setProperties(result.properties);
        setCurrentPage(0); // Reset pagination on new search
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoadingProperties(false);
    }
  };

  React.useEffect(() => {
    fetchProperties();
  }, []);

  const handleSearch = () => {
    const filters = {};
    if (locationQuery) filters.location = locationQuery;
    if (purchaseType) filters.listingType = purchaseType;
    if (propertyType) filters.propertyType = propertyType;
    if (priceRange) {
      filters.minPrice = priceRange.min;
      filters.maxPrice = priceRange.max;
    }
    fetchProperties(filters);
    setActiveDropdown(null);
  };

  const totalPages = Math.ceil(properties.length / itemsPerPage) || 1;
  const currentItems = properties.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const nextPage = () => setCurrentPage((prev) => (prev + 1) % totalPages);
  const prevPage = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);

  // Scroll animations
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const illustrationY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const illustrationScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);

  const handleGetStartedClick = (e) => {
    e.preventDefault();
    navigate('/user-type');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/user-type?search=${encodeURIComponent(searchText.trim())}`);
    } else {
      navigate('/user-type');
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/user-type');
  };

  return (
    <div className="bg-[#FAF9F6] overflow-x-hidden">
      <div
        className="h-screen w-full bg-cover bg-center hero-container flex flex-col overflow-hidden relative sticky top-0 z-0"
        style={{
          backgroundImage: 'url("/images/hero-bg-new.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'transparent',
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.set(e.clientX - rect.left - rect.width / 2);
        }}
      >
        {/* Overlay Illustration */}
        <motion.div 
          className="absolute bottom-0 left-0 w-full flex justify-center items-end pointer-events-none z-0"
          style={{ height: '100%', y: illustrationY, scale: illustrationScale }}
        >
          <img 
            src="/images/illustration-user.png" 
            alt="Modern Home Illustration" 
            className="w-full h-auto object-cover object-bottom max-h-[80vh] lg:max-h-[85vh]"
            style={{ marginBottom: '0' }}
          />
        </motion.div>

        <style>{`
          @media (max-width: 768px) {
            .hero-container {
              background-position: center !important;
            }
          }
        `}</style>

        {/* Header */}
        <motion.header
          className="relative z-20 flex items-center justify-between px-2 py-1 sm:px-6 sm:py-6 lg:px-12 w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Logo */}
          <div className="flex items-center">
            <img src="/images/logo.png" alt="HomeSwift Logo" className="logo-img w-48 sm:w-60 h-10 rounded-lg object-cover" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2 bg-white/40 backdrop-blur-md border border-white/20 rounded-full px-8 py-2.5 shadow-sm z-20">
            <a href="/" className="text-[#2C3E50] text-sm font-medium border-b-2 border-[#FF6B35] pb-0.5">Home</a>
            <a href="/faq" className="text-[#2C3E50]/70 text-sm hover:text-[#FF6B35] transition-colors font-medium">FAQs</a>
            <a href="/about" className="text-[#2C3E50]/70 text-sm hover:text-[#FF6B35] transition-colors font-medium">About Us</a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            <motion.button
              onClick={handleGetStartedClick}
              className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#FF7B45] transition-colors shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Get Started
            </motion.button>
            <motion.button
              onClick={handleLoginClick}
              className="bg-transparent border border-gray-300 text-[#2C3E50] px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Login
            </motion.button>
          </div>
        
          <motion.button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-[#FF6B35] p-2 ml-auto"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <AnimatePresence mode="wait">
              {showMobileMenu ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.header>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="md:hidden fixed inset-0 z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-[#1C2C3E]/40 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
              />
              
              {/* Menu Content */}
              <motion.div
                className="absolute right-0 top-0 h-full w-[85%] bg-white shadow-2xl overflow-hidden flex flex-col"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <div className="p-8 flex items-center justify-between border-b border-gray-100">
                  <img src="/images/logo.png" alt="HomeSwift Logo" className="w-28 h-7 object-contain" />
                  <motion.button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 rounded-xl bg-gray-50 text-[#1C2C3E]"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto py-10 px-8">
                  <nav className="space-y-4">
                    {[
                      { name: 'Home', href: '/', icon: ArrowRight, active: true },
                      { name: 'Browse Properties', href: '/properties', icon: Search },
                      { name: 'About Us', href: '/about', icon: Info },
                      { name: 'FAQs', href: '/faq', icon: Mail },
                    ].map((item, i) => (
                      <motion.a
                        key={item.name}
                        href={item.href}
                        className={`flex items-center justify-between p-5 rounded-2xl text-lg font-bold transition-all ${item.active ? 'bg-[#FF6B35] text-white shadow-lg shadow-orange-100' : 'text-[#1C2C3E] hover:bg-gray-50'}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="flex items-center">
                          <item.icon size={20} className="mr-4 opacity-70" />
                          {item.name}
                        </span>
                        <ArrowUpRight size={18} className="opacity-40" />
                      </motion.a>
                    ))}
                  </nav>

                  <div className="mt-12 pt-12 border-t border-gray-100 space-y-4">
                    <motion.button
                      onClick={(e) => { handleLoginClick(e); setShowMobileMenu(false); }}
                      className="w-full py-4 rounded-2xl border-2 border-[#1C2C3E] text-[#1C2C3E] font-bold"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      Login
                    </motion.button>
                    <motion.button
                      onClick={(e) => { handleGetStartedClick(e); setShowMobileMenu(false); }}
                      className="w-full py-4 rounded-2xl bg-[#FF6B35] text-white font-bold shadow-lg shadow-orange-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      Get Started
                    </motion.button>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 flex items-center justify-between">
                  <div className="flex space-x-4">
                    {[Instagram, Twitter, Facebook].map((Icon, i) => (
                      <a key={i} href="#" className="p-2 text-[#1C2C3E]/40 hover:text-[#FF6B35] transition-colors">
                        <Icon size={20} />
                      </a>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-[#1C2C3E]/30 uppercase tracking-widest">Connect with us</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.main 
          className="relative z-10 flex flex-1 flex-col items-center justify-start md:justify-center pt-20 md:pt-0 px-4 sm:px-6 text-center"
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        >
          {/* Feature Tag */}
          <motion.div
            className="flex items-center space-x-2 bg-white/40 backdrop-blur-md border border-white/30 shadow-xs rounded-full px-5 py-2 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
            <span className="text-[#1C2C3E] text-[11px] font-bold uppercase tracking-widest">Verified Properties Only</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-center mb-6 sm:mb-8 max-w-4xl text-4xl md:text-5xl lg:text-6xl text-[#1C2C3E] leading-[1.1] font-bold tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
          >
            The Modern Way to<br />
            Find Your Next Home
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            className="text-sm md:text-lg text-[#1C2C3E]/60 mb-10 sm:mb-14 max-w-2xl leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
          >
            Connect directly with verified landlords and discover exclusive listings across Nigeria. No heavy agency fees, just transparent deals.
          </motion.p>

          {/* Search Interface - Dual Capsule Style */}
          <motion.div
            className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-3 px-4"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.7 }}
          >
            {/* Unified Capsule: Search Parameters + Action */}
            <div className="flex-[3] w-full bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl md:rounded-full p-4 md:px-3 md:py-1 flex flex-col md:flex-row items-center shadow-2xl shadow-black/5 transition-all hover:bg-white/25">
              {/* Where Pod */}
              <div className="w-full md:flex-1 flex flex-col items-start px-4 py-3 md:py-2">
                <span className="text-[13px] font-bold text-[#1C2C3E]">Where</span>
                <input 
                  type="text" 
                  placeholder="Search location" 
                  value={heroLocation}
                  onChange={(e) => setHeroLocation(e.target.value)}
                  className="bg-transparent border-none p-0 text-[11px] text-[#1C2C3E] placeholder-[#1C2C3E]/50 focus:ring-0 w-full font-medium" 
                />
              </div>

              <div className="w-full md:w-[1px] h-[1px] md:h-8 bg-white/10 md:bg-gray-200/40 my-1 md:my-0" />

              {/* Purchase Pod */}
              <div 
                className="w-full md:flex-1 relative flex flex-col items-start px-4 py-3 md:py-2 cursor-pointer group"
                onClick={() => setHeroActiveDropdown(heroActiveDropdown === 'purchase' ? null : 'purchase')}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-[13px] font-bold text-[#1C2C3E]">Purchase</span>
                  <ChevronDown size={12} className={`text-[#1C2C3E]/30 transition-transform ${heroActiveDropdown === 'purchase' ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[11px] text-[#1C2C3E]/50 truncate">{heroPurchase}</span>

                <AnimatePresence>
                  {heroActiveDropdown === 'purchase' && (
                    <motion.div
                      className="absolute top-full left-0 mt-4 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      {['For Rent', 'For Sale', 'Short Let'].map((p) => (
                        <button
                          key={p}
                          onClick={(e) => { e.stopPropagation(); setHeroPurchase(p); setHeroActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-xl text-sm font-medium text-[#1C2C3E] transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full md:w-[1px] h-[1px] md:h-8 bg-white/10 md:bg-gray-200/40 my-1 md:my-0" />

              {/* Type Pod */}
              <div 
                className="w-full md:flex-1 relative flex flex-col items-start px-4 py-3 md:py-2 cursor-pointer group"
                onClick={() => setHeroActiveDropdown(heroActiveDropdown === 'type' ? null : 'type')}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-[13px] font-bold text-[#1C2C3E]">Type</span>
                  <ChevronDown size={12} className={`text-[#1C2C3E]/30 transition-transform ${heroActiveDropdown === 'type' ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[11px] text-[#1C2C3E]/50 truncate">{heroType}</span>

                <AnimatePresence>
                  {heroActiveDropdown === 'type' && (
                    <motion.div
                      className="absolute top-full left-0 mt-4 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      {['Apartment', 'House', 'Villa', 'Office'].map((t) => (
                        <button
                          key={t}
                          onClick={(e) => { e.stopPropagation(); setHeroType(t); setHeroActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-xl text-sm font-medium text-[#1C2C3E] transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full md:w-[1px] h-[1px] md:h-8 bg-white/10 md:bg-gray-200/40 my-1 md:my-0" />

              {/* Price Range Pod */}
              <div 
                className="w-full md:flex-[1.2] relative flex flex-col items-start px-4 py-3 md:py-2 cursor-pointer group"
                onClick={() => setHeroActiveDropdown(heroActiveDropdown === 'budget' ? null : 'budget')}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-[13px] font-bold text-[#1C2C3E]">Price Range</span>
                  <ChevronDown size={12} className={`text-[#1C2C3E]/30 transition-transform ${heroActiveDropdown === 'budget' ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[11px] text-[#1C2C3E]/50 truncate">{heroBudget}</span>

                <AnimatePresence>
                  {heroActiveDropdown === 'budget' && (
                    <motion.div
                      className="absolute top-full left-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      {['Any Price', 'Under ₦2m', '₦2m - ₦5m', '₦5m - ₦10m', 'Above ₦10m'].map((b) => (
                        <button
                          key={b}
                          onClick={(e) => { e.stopPropagation(); setHeroBudget(b); setHeroActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-xl text-sm font-medium text-[#1C2C3E] transition-colors"
                        >
                          {b}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile: Integrated Search Button */}
              <div className="md:hidden w-full mt-2">
                <button 
                  onClick={() => navigate('/properties')}
                  className="w-full flex items-center justify-center space-x-2 bg-[#FF6B35] text-white px-6 py-3.5 rounded-2xl font-extrabold hover:bg-[#FF7B45] hover:shadow-lg hover:shadow-orange-200/50 transition-all active:scale-95 shadow-md"
                  aria-label="Search Properties"
                >
                  <Search size={18} />
                  <span className="text-[14px]">Search Properties</span>
                </button>
              </div>
            </div>

            {/* Desktop: Separate Action Capsule */}
            <div className="hidden md:flex flex-none bg-white/30 backdrop-blur-xl border border-white/40 rounded-full p-1 items-center justify-center shadow-2xl shadow-black/5 min-w-[70px]">
              <button 
                onClick={() => navigate('/properties')}
                className="flex items-center justify-center bg-[#FF6B35] text-white w-10 h-10 rounded-full font-extrabold hover:bg-[#FF7B45] hover:shadow-lg hover:shadow-orange-200/50 transition-all active:scale-95 group shadow-md"
                aria-label="Search Properties"
              >
                <Search size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </motion.div>
        </motion.main>
      </div>

      {/* Spacer to allow scrolling and trigger sticky behavior */}
      <div className="h-[30vh]" />

      {/* Trust Section */}
      <section className="bg-white py-32 px-6 sm:px-12 lg:px-24 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-[#1C2C3E] leading-[1.2] mb-10 tracking-tight">
              Trusted by <span className="font-bold">15,670+</span><br />
              Landlords and Renters
            </h2>
            
            <div className="flex items-center -space-x-3 mb-8">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-14 h-14 rounded-full border-4 border-white object-cover bg-blue-100" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" className="w-14 h-14 rounded-full border-4 border-white object-cover bg-green-100" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe" alt="User" className="w-14 h-14 rounded-full border-4 border-white object-cover bg-purple-100" />
              <div className="w-14 h-14 rounded-full border-4 border-white bg-[#FF6B35] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                +100
              </div>
            </div>

            <motion.a 
              href="/landlords" 
              className="inline-flex items-center text-[#1C2C3E] font-medium border-b-2 border-[#1C2C3E] pb-1 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
              whileHover={{ x: 5 }}
            >
              See Verified Landlords <ArrowUpRight size={18} className="ml-2" />
            </motion.a>
          </motion.div>
          
          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-[#1C2C3E]/70 text-lg leading-relaxed mb-12 max-w-xl font-medium">
              Over 15,000 landlords and renters across Nigeria rely on HomeSwift to find, list, and secure homes with confidence. 
              From verified listings to transparent deals, we're building a trusted community that makes renting and buying homes simple, safe, and stress-free.
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <motion.button 
                className="bg-[#FF6B35] text-white px-10 py-4 rounded-full font-bold flex items-center shadow-lg shadow-orange-200 hover:bg-[#FF7B45] transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Listings <ArrowRight size={20} className="ml-3" />
              </motion.button>
              <motion.button 
                className="text-[#1C2C3E] px-8 py-4 rounded-full font-bold hover:bg-gray-100/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Listings
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Decorative Starburst */}
        <motion.div 
          className="hidden md:block absolute left-1/2 bottom-10 -translate-x-1/2 text-[#FF6B35]/20 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0L53 47L100 50L53 53L50 100L47 53L0 50L47 47L50 0Z" stroke="currentColor" strokeWidth="0.5" />
            <path d="M14.6 14.6L47.9 47.9L50 50L52.1 52.1L85.4 85.4M14.6 85.4L47.9 52.1L50 50L52.1 47.9L85.4 14.6" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </motion.div>
      </section>

      {/* Who are we Section */}
      <section className="bg-white py-20 px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] mr-2" />
            <span className="text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider">Who are we?</span>
          </motion.div>

          <motion.h2
            className="text-2xl md:text-3xl font-semibold text-[#1C2C3E] leading-[1.3] max-w-4xl mb-12 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            We are a tech-driven real estate platform connecting landlords and renters directly. <span className="text-[#5D7B93]">Our goal is to make finding and renting homes faster, transparent, and stress-free with smart AI and verified listings.</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              { src: '/images/house-1.png', delay: 0 },
              { src: '/images/house-2.png', delay: 0.2 },
              { src: '/images/house-3.png', delay: 0.4 },
            ].map((img, idx) => (
              <motion.div
                key={idx}
                className="overflow-hidden rounded-2xl h-52 md:h-64 shadow-md"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: img.delay }}
              >
                <img src={img.src} alt={`Modern House ${idx+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="bg-white py-20 px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <motion.div
            className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider">Our Achievements</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] ml-2" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {[
              { label: 'Customer Satisfaction', value: '98%' },
              { label: 'Verified Listings', value: '12K+' },
              { label: 'Successful Rentals', value: '8K+' },
              { label: 'Active Users', value: '15K+' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="bg-[#F8F9FA] p-6 md:p-8 rounded-2xl flex flex-col items-center text-center group hover:bg-[#FF6B35] transition-colors duration-500"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <span className="text-3xl md:text-4xl font-bold text-[#1C2C3E] mb-2 group-hover:text-white transition-colors tracking-tight">{stat.value}</span>
                <span className="text-[#1C2C3E]/50 text-[10px] md:text-xs font-medium group-hover:text-white/80 transition-colors uppercase tracking-widest">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed About Section */}
      <section className="bg-white py-24 px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Visual representation */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <div className="bg-[#FAF9F7] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden aspect-square flex flex-col justify-end shadow-xs group">
              <img src="/images/house-1.png" alt="Featured Property" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />
              
              <div className="relative z-10 space-y-4">
                {[
                  { title: 'HomeSwift (Outcome)', desc: 'Renting in days, not months, at 2% transaction fee vs 10%+ agency fees' },
                  { title: 'HomeSwift (Outcome)', desc: 'Cut renting costs 80% with direct landlord access, no hidden fees.' },
                  { title: 'HomeSwift (Outcome)', desc: 'Get personalized home matches in seconds, tailored to your needs' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/50 flex items-start space-x-3 max-w-sm"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + idx * 0.2 }}
                  >
                    <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center shrink-0">
                      <img src="/images/logo.png" className="w-4 h-4 object-contain invert grayscale" alt="HS" />
                    </div>
                    <div>
                      <h4 className="text-[#1C2C3E] font-bold text-[13px] mb-0.5">{item.title}</h4>
                      <p className="text-[#1C2C3E]/60 text-[10px] leading-tight">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Text details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] mr-2" />
              <span className="text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider">About Us</span>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2C3E] leading-[1.2] mb-6 tracking-tight">
              Find Your Next Home <span className="flex items-center inline-flex">
                <div className="flex -space-x-1 mx-2">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=A" className="w-6 h-6 rounded-full border border-white bg-blue-50" />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=B" className="w-6 h-6 rounded-full border border-white bg-green-50" />
                  <div className="w-6 h-6 rounded-full border border-white bg-[#FF6B35] flex items-center justify-center text-[7px] text-white font-bold">AI</div>
                </div>
              </span> With AI, at a Fraction of The Usual Cost.
            </h2>

            <p className="text-[#1C2C3E]/60 text-base leading-relaxed mb-8 font-medium">
              Find verified homes fast, talk directly to landlords, and move in without delays or heavy fees. HomeSwift streamlines your entire renting journey with AI-guided search, real-time communication, secure verification, and a seamless experience designed to save you time, stress, and money.
            </p>

            <motion.button
              className="px-8 py-3 rounded-full border-2 border-[#FF6B35]/30 text-[#FF6B35] font-bold hover:bg-[#FF6B35] hover:text-white transition-all duration-300 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More →
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Popular Listings Section */}
      <section className="bg-white py-24 px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <motion.div
                className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] mr-2" />
                <span className="text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider">Listings</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2C3E] mb-4 tracking-tight">Popular Listings</h2>
              <p className="text-[#1C2C3E]/50 text-base font-medium">Listings getting the most attention this week.</p>
            </div>
            
            <div className="flex items-center space-x-6 mt-8 md:mt-0">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={prevPage}
                  className="p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={20} className={currentPage === 0 ? "text-[#1C2C3E]/20" : "text-[#1C2C3E]"} />
                </button>
                <span className="text-[#1C2C3E] text-sm font-bold tracking-widest">
                  <span className="text-[#1C2C3E]">{(currentPage + 1).toString().padStart(2, '0')}</span>
                  <span className="text-gray-300">/{totalPages.toString().padStart(2, '0')}</span>
                </span>
                <button 
                  onClick={nextPage}
                  className="p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={20} className={currentPage === totalPages - 1 ? "text-[#1C2C3E]/20" : "text-[#1C2C3E]"} />
                </button>
              </div>
            </div>
          </div>

          {/* Search/Filter Bar */}
          <motion.div
            className="bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-[2rem] p-3 mb-16 flex flex-col lg:flex-row lg:items-center gap-2 relative z-50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 px-4 py-2">
              {/* Where Filter */}
              <div className="flex flex-col border-r-0 lg:border-r border-gray-100 pr-4 last:border-r-0 group">
                <label className="text-[#1C2C3E] font-bold text-sm mb-1 cursor-pointer">Where</label>
                <input 
                  type="text" 
                  placeholder="Search location" 
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="text-[#1C2C3E] text-xs bg-transparent border-none p-0 focus:ring-0 placeholder-[#1C2C3E]/30"
                />
              </div>

              {/* Purchase Filter */}
              <div className="flex flex-col border-r-0 lg:border-r border-gray-100 pr-4 last:border-r-0 relative">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setActiveDropdown(activeDropdown === 'purchase' ? null : 'purchase')}
                >
                  <span className="text-[#1C2C3E] font-bold text-sm mb-1">Purchase</span>
                  <ChevronDown size={14} className={`text-[#1C2C3E]/40 transition-transform ${activeDropdown === 'purchase' ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[#1C2C3E]/40 text-xs truncate">
                  {purchaseType ? (purchaseType === 'for-rent' ? 'For Rent' : 'For Sale') : 'Add Purchase Type'}
                </span>
                
                <AnimatePresence>
                  {activeDropdown === 'purchase' && (
                    <motion.div 
                      key="purchase-dropdown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-4 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-[60]"
                    >
                      {['for-rent', 'for-sale'].map((type) => (
                        <button
                          key={type}
                          onClick={() => { setPurchaseType(type); setActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-[#1C2C3E] hover:bg-gray-50 rounded-xl capitalize transition-colors"
                        >
                          {type.replace('-', ' ')}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Type Filter */}
              <div className="flex flex-col border-r-0 lg:border-r border-gray-100 pr-4 last:border-r-0 relative">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                >
                  <span className="text-[#1C2C3E] font-bold text-sm mb-1">Type</span>
                  <ChevronDown size={14} className={`text-[#1C2C3E]/40 transition-transform ${activeDropdown === 'type' ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[#1C2C3E]/40 text-xs truncate">
                  {propertyType || 'Add Type'}
                </span>

                <AnimatePresence>
                  {activeDropdown === 'type' && (
                    <motion.div 
                      key="type-dropdown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-4 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-[60]"
                    >
                      {['Apartment', 'House', 'Villa', 'Office', 'Townhouse'].map((type) => (
                        <button
                          key={type}
                          onClick={() => { setPropertyType(type); setActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-[#1C2C3E] hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          {type}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Range Filter */}
              <div className="flex flex-col relative">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                >
                  <span className="text-[#1C2C3E] font-bold text-sm mb-1">Price Range</span>
                  <ChevronDown size={14} className={`text-[#1C2C3E]/40 transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[#1C2C3E]/40 text-xs">
                  {priceRange ? `₦${priceRange.min / 1000}k - ₦${priceRange.max / 1000}k` : 'Select a price range'}
                </span>

                <AnimatePresence>
                  {activeDropdown === 'price' && (
                    <motion.div 
                      key="price-dropdown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-4 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-[60]"
                    >
                      {[
                        { label: 'Any Price', val: null },
                        { label: 'Under ₦500k', val: { min: 0, max: 500000 } },
                        { label: '₦500k - ₦2m', val: { min: 500000, max: 2000000 } },
                        { label: '₦2m - ₦5m', val: { min: 2000000, max: 5000000 } },
                        { label: 'Above ₦5m', val: { min: 5000000, max: 50000000 } },
                      ].map((range) => (
                        <button
                          key={range.label}
                          onClick={() => { setPriceRange(range.val); setActiveDropdown(null); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-[#1C2C3E] hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          {range.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-1">
              <button 
                onClick={() => {
                  setLocationQuery('');
                  setPurchaseType('');
                  setPropertyType('');
                  setPriceRange(null);
                  fetchProperties();
                }}
                className="flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 px-6 py-3 rounded-2xl transition-all font-bold text-[#1C2C3E] text-sm"
              >
                <SlidersHorizontal size={18} />
                <span>Reset</span>
              </button>
              <button 
                onClick={handleSearch}
                className="flex-1 lg:flex-none flex items-center justify-center space-x-2 bg-[#FF6B35] hover:bg-[#FF7B45] text-white px-8 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-orange-100 text-sm"
              >
                <Search size={18} />
                <span>Search</span>
              </button>
            </div>
          </motion.div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingProperties ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse">
                  <div className="bg-gray-200 rounded-[2rem] aspect-[4/3] mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              ))
            ) : currentItems.length > 0 ? (
              currentItems.map((property, idx) => (
                <motion.div
                  key={property.id}
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx % 3) * 0.1 }}
                  onClick={() => navigate(`/properties/${property.id}`)}
                >
                  <div className="relative overflow-hidden rounded-[2rem] aspect-[4/3] mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                    <img 
                      src={property.images?.[0] || '/images/house-1.png'} 
                      alt={property.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-5 left-5 w-8 h-8 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center shadow-xs">
                      <div className="w-4 h-4 text-[#FF6B35]">
                        <Heart size={16} className={property.is_saved ? "fill-current" : ""} />
                      </div>
                    </div>
                    <div className="absolute top-5 right-5 px-3 py-1 bg-[#1C2C3E]/40 backdrop-blur-md border border-white/20 rounded-full">
                      <span className="text-white text-[10px] font-bold capitalize">
                        {property.listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
                      </span>
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#1C2C3E]">
                        ₦{property.price?.toLocaleString()}
                        <span className="text-xs text-[#1C2C3E]/30 font-medium lowercase"> 
                          {property.listing_type === 'for-rent' ? ' /year' : ''}
                        </span>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1C2C3E] mb-1 line-clamp-1">{property.title}</h3>
                    <div className="flex items-center text-[#1C2C3E]/40 mb-5">
                      <MapPin size={14} className="mr-1.5 shrink-0" />
                      <span className="text-xs font-medium line-clamp-1">{property.location}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                      <div className="flex items-center space-x-1.5 text-[#1C2C3E]/40 font-bold">
                        <Bed size={16} />
                        <span className="text-xs">{property.bedrooms || property.rooms || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[#1C2C3E]/40 font-bold">
                        <Bath size={16} />
                        <span className="text-xs">{property.bathrooms || 0}</span>
                      </div>
                      {property.area && (
                        <div className="flex items-center space-x-1.5 text-[#1C2C3E]/40 font-bold">
                          <Ruler size={16} />
                          <span className="text-xs">{property.area.toLocaleString()} sq.ft</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-500">No properties found.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-24 px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 mb-6">
              <span className="text-[#FF6B35] text-[10px] font-bold uppercase tracking-wider">Common Questions</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2C3E] mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-[#1C2C3E]/50 text-base font-medium">Everything you need to know about HomeSwift.</p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "How does HomeSwift AI work?",
                a: "Our AI processes your natural language descriptions (e.g., 'a cozy 2-bedroom with a large kitchen near Lekki') and cross-references them with our database of verified properties to find the perfect match in seconds."
              },
              {
                q: "Are the listings verified?",
                a: "Yes. Every property listed on HomeSwift undergoes a rigorous verification process to ensure the landlord is legitimate and the property details are accurate, protecting you from fraud."
              },
              {
                q: "What are the transaction fees?",
                a: "We charge a transparent 2% transaction fee for successful deals. This is significantly lower than the traditional 10% or more typically charged by agencies across Nigeria."
              },
              {
                q: "How do I contact landlords?",
                a: "Once you find a property you like, you can initiate a secure chat directly with the landlord through our platform. No middle-man needed."
              },
              {
                q: "Is my payment information secure?",
                a: "Absolutely. We use bank-grade encryption and partner with industry-leading payment processors to ensure all transactions are handled with the highest level of security."
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${activeFAQ === idx ? 'border-[#FF6B35] bg-[#FF6B35]/[0.02]' : 'border-gray-100 hover:border-gray-200'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <button
                  onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-[#1C2C3E]">{faq.q}</span>
                  <div className={`transition-transform duration-300 ${activeFAQ === idx ? 'rotate-180 text-[#FF6B35]' : 'text-[#1C2C3E]/30'}`}>
                    {activeFAQ === idx ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </button>
                <AnimatePresence>
                  {activeFAQ === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-[#1C2C3E]/60 text-sm leading-relaxed font-medium">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="bg-[#1C2C3E] rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF6B35]/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 border border-white/5 rounded-full pointer-events-none" />
              <div className="absolute top-[-50px] left-[-50px] w-64 h-64 border border-white/5 rounded-full pointer-events-none" />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight leading-[1.1]">
                  Ready to Find Your <br />
                  Ideal Home?
                </h2>
                <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
                  Join thousands of happy Nigerians who found their dream homes without the stress and high costs.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <motion.button
                    onClick={() => navigate('/auth/register')}
                    className="w-full sm:w-auto bg-[#FF6B35] text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-orange-900/20 hover:bg-[#FF7B45] transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started Now
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/properties')}
                    className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-full font-bold hover:bg-white/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Browse Listings
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 px-6 sm:px-12 lg:px-24 border-t border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {/* Brand Column */}
            <div className="space-y-6">
              <img src="/images/logo.png" alt="HomeSwift Logo" className="h-10 w-auto object-contain rounded-xl" />
              <p className="text-[#1C2C3E]/60 text-sm leading-relaxed font-medium">
                HomeSwift is a tech-driven real estate platform revolutionizing the way Nigerians find and secure homes through AI and direct verification.
              </p>
              <div className="flex items-center space-x-4">
                {[
                  { icon: Facebook, href: "#" },
                  { icon: Twitter, href: "#" },
                  { icon: Instagram, href: "#" },
                  { icon: Linkedin, href: "#" }
                ].map((social, idx) => (
                  <motion.a
                    key={idx}
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#1C2C3E]/40 hover:bg-[#FF6B35] hover:text-white transition-all shadow-xs"
                    whileHover={{ y: -3 }}
                  >
                    <social.icon size={18} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h4 className="text-[#1C2C3E] font-bold text-sm uppercase tracking-widest mb-8">Navigation</h4>
              <ul className="space-y-4">
                {['Home', 'Browse Properties', 'How it Works', 'About us', 'FAQs'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[#1C2C3E]/60 text-sm font-medium hover:text-[#FF6B35] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-[#1C2C3E] font-bold text-sm uppercase tracking-widest mb-8">Support</h4>
              <ul className="space-y-6">
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[#FF6B35]">
                    <Mail size={16} />
                  </div>
                  <span className="text-[#1C2C3E]/60 text-sm font-medium">hello@homeswift.com</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[#FF6B35]">
                    <Phone size={16} />
                  </div>
                  <span className="text-[#1C2C3E]/60 text-sm font-medium">+234 (01) 234 5678</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[#FF6B35]">
                    <MapPin size={16} />
                  </div>
                  <span className="text-[#1C2C3E]/60 text-sm font-medium leading-snug">
                    Victoria Island, Lagos, Nigeria
                  </span>
                </li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div>
              <h4 className="text-[#1C2C3E] font-bold text-sm uppercase tracking-widest mb-8">Stay Updated</h4>
              <p className="text-[#1C2C3E]/60 text-xs mb-6 leading-relaxed font-medium">
                Subscribe for the latest listings and platform updates.
              </p>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:bg-white focus:border-[#FF6B35]/30 transition-all font-medium"
                />
                <button className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-[#FF6B35] text-white rounded-xl text-xs font-bold hover:bg-[#FF7B45] transition-colors shadow-sm">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[#1C2C3E]/40 text-[11px] font-bold tracking-wider uppercase">
              © {new Date().getFullYear()} HomeSwift Technologies Inc.
            </p>
            <div className="flex items-center space-x-8">
              <a href="#" className="text-[#1C2C3E]/40 text-[11px] font-bold hover:text-[#1C2C3E] transition-colors uppercase tracking-wider">Privacy Policy</a>
              <a href="#" className="text-[#1C2C3E]/40 text-[11px] font-bold hover:text-[#1C2C3E] transition-colors uppercase tracking-wider">Terms of Service</a>
              <p className="text-[#1C2C3E]/40 text-[11px] font-bold uppercase tracking-wider flex items-center">
                Built with <Heart size={10} className="mx-1.5 text-red-400 fill-current" /> across Nigeria
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
