import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowRight, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [searchText, setSearchText] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleGetStartedClick = (e) => {
    e.preventDefault();
    navigate('/user-type');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      // Navigate to user type page with search query
      navigate(`/user-type?search=${encodeURIComponent(searchText.trim())}`);
    } else {
      // If empty search, just go to user type page
      navigate('/user-type');
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/user-type');
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center hero-container flex flex-col overflow-hidden relative"
      style={{
        backgroundImage: 'url("/images/2338_1.png")',
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
      <div 
        className="absolute bottom-0 left-0 w-full flex justify-center items-end pointer-events-none z-0"
        style={{ height: '100%' }}
      >
        <img 
          src="/images/Illustration.png" 
          alt="Modern Home Illustration" 
          className="w-full h-auto object-cover object-bottom"
          style={{ marginBottom: '-5%' }}
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-container {
            background-position: center !important;
          }
        }
      `}</style>
      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between px-2 py-1 sm:px-6 sm:py-6 lg:px-12 w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex items-center">
          <img src="/images/logo.png" alt="HomeSwift Logo" className="logo-img w-48 sm:w-60 h-10 rounded-lg object-cover" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2 bg-white/30 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 shadow-lg z-20">
          <a href="/" className="text-[#2C3E50] text-sm font-medium border-b-2 border-[#FF6B35] pb-1">Home</a>
          <a href="/faq" className="text-[#2C3E50] text-sm hover:text-[#FF6B35] transition-colors font-medium">FAQs</a>
          <a href="/about" className="text-[#2C3E50] text-sm hover:text-[#FF6B35] transition-colors font-medium">About Us</a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          <motion.button
            onClick={handleGetStartedClick}
            className="flex items-center space-x-2 bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#FF7B45] transition-colors"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span>Get Started</span>
            <motion.div 
              className="w-5 h-5 bg-white text-[#2C3E50] rounded-full flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <ArrowRight size={12} className="text-[#2C3E50]" />
            </motion.div>
          </motion.button>
          <motion.button
            onClick={handleLoginClick}
            className="bg-transparent border border-gray-400 text-[#2C3E50] px-5 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Login
          </motion.button>
        </div>
      
        {/* Mobile Menu Button */}
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              className="md:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-30 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center">
                  <img src="/images/logo.png" alt="HomeSwift Logo" className="w-32 h-8 object-cover rounded-lg" />
                </div>
                <motion.button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} className="text-[#2C3E50]" />
                </motion.button>
              </div>

              {/* Menu Content */}
              <div className="p-6 space-y-8">
                {/* Navigation Links */}
                <nav className="space-y-2">
                  <a 
                    href="/" 
                    className="block px-4 py-3 text-[#2C3E50] text-lg font-semibold bg-[#FF6B35]/10 rounded-lg border-l-4 border-[#FF6B35] hover:bg-[#FF6B35]/20 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </a>
                  <a 
                    href="/faq" 
                    className="block px-4 py-3 text-[#2C3E50]/70 text-lg hover:text-[#FF6B35] hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    FAQs
                  </a>
                  <a 
                    href="/about" 
                    className="block px-4 py-3 text-[#2C3E50]/70 text-lg hover:text-[#FF6B35] hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    About Us
                  </a>
                </nav>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    onClick={(e) => {
                      handleGetStartedClick(e);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-linear-to-r from-[#FF6B35] to-[#FF7B45] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#FF7B45] hover:to-[#FF8B55] transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Get Started</span>
                    <motion.div 
                      className="w-6 h-6 bg-white text-[#2C3E50] rounded-full flex items-center justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <ArrowRight size={14} className="text-[#2C3E50]" />
                    </motion.div>
                  </motion.button>
                  
                  <motion.button
                    onClick={(e) => {
                      handleLoginClick(e);
                      setShowMobileMenu(false);
                    }}
                    className="w-full bg-white border-2 border-[#2C3E50] text-[#2C3E50] px-6 py-3 rounded-xl font-semibold hover:bg-[#2C3E50] hover:text-white transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 text-center">
        {/* Feature Tag */}
        <motion.div
          className="flex items-center space-x-2 bg-white/30 backdrop-blur-md border border-white/20 shadow-sm rounded-[2rem] px-6 py-3 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -2 }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-[#2C3E50]" />
          </motion.div>
          <span className="text-[#2C3E50] text-sm font-medium">Smarter, faster, simpler home search</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          className="text-center mb-6 sm:mb-10 max-w-4xl text-2xl md:text-3xl lg:text-4xl text-[#2C3E50] leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        >
          Tell Us What Kind Of<br />
          Home You Want
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          className="text-xs md:text-sm text-[#FF6B35] mb-8 sm:mb-12 max-w-2xl leading-relaxed font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
        >
        Describe your dream home—cozy apartment, family house, or modern duplex. HomeSwift AI understands and instantly connects you with the best options.
        </motion.p>

        {/* Search Input */}
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.7 }}
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative group">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Describe your ideal home (e.g., '3-bedroom apartment in Lagos with balcony')"
                className="w-full bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full px-6 py-3 text-[#2C3E50] text-base placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] focus:bg-white focus:shadow-xl transition-all duration-300"
              />
              <motion.button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#FF6B35] text-white p-2 rounded-full hover:bg-[#FF7B45] transition-colors shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowUp size={20} className="rotate-45" />
              </motion.button>
            </div>
            <p className="mt-3 text-xs text-[#2C3E50]/60 text-center">
              Try: "cozy apartment near university" or "family house with garden"
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;
