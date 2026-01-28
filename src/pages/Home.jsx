import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Menu, X } from 'lucide-react';
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
      className="min-h-[120vh] w-full bg-cover bg-center hero-container flex flex-col overflow-hidden relative"
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
      <div 
        className="absolute bottom-0 left-0 w-full flex justify-center items-end pointer-events-none z-0"
        style={{ height: '100%' }}
      >
        <img 
          src="/images/illustration-user.png" 
          alt="Modern Home Illustration" 
          className="w-full h-auto object-cover object-bottom max-h-[65vh] md:max-h-[55vh] lg:max-h-[60vh]"
          style={{ marginBottom: '0' }}
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-container {
            background-position: center !important;
            min-height: 100vh !important;
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
      <main className="relative z-10 flex flex-1 flex-col items-center justify-start pt-16 sm:pt-24 px-4 sm:px-6 text-center">
        {/* Feature Tag */}
        <motion.div
          className="flex items-center space-x-2 bg-blue-50/40 backdrop-blur-md border border-white/30 shadow-xs rounded-full px-4 py-1.5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        >
          <motion.div>
            <Sparkles className="w-3 h-3 text-[#2C3E50]/70" />
          </motion.div>
          <span className="text-[#2C3E50]/80 text-[11px] font-medium tracking-tight">Smarter, faster, simpler home search</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          className="text-center mb-6 sm:mb-8 max-w-4xl text-3xl md:text-4xl lg:text-5xl text-[#2C3E50] leading-[1.1] font-semibold tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        >
          Tell Us What Kind Of<br />
          Home You Want
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          className="text-xs md:text-sm text-[#2C3E50]/60 mb-10 sm:mb-12 max-w-2xl leading-relaxed font-normal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
        >
          Describe your dream home—cozy apartment, family house, or modern duplex. HomeSwift AI understands and instantly connects you with the best options.
        </motion.p>

        {/* Search Input */}
        <motion.div
          className="w-full max-w-md pb-32"
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
                placeholder="Describe your ideal home"
                className="w-full bg-blue-100/30 backdrop-blur-md border border-white/40 rounded-full px-8 py-4 text-[#2C3E50] text-sm placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 focus:bg-white/60 transition-all duration-300 shadow-sm"
              />
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#2C3E50]/40"
              >
                <Sparkles size={20} />
              </motion.div>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Trust Section */}
      <section className="bg-[#FFFDFB] py-24 px-6 sm:px-12 lg:px-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-[#1C2C3E] leading-[1.2] mb-10 tracking-tight">
              Trusted by <span className="font-bold">15,670+</span><br />
              Landlords and Renters
            </h2>
            
            <div className="flex items-center -space-x-3 mb-8">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-14 h-14 rounded-full border-4 border-[#FFFDFB] object-cover bg-blue-100" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" className="w-14 h-14 rounded-full border-4 border-[#FFFDFB] object-cover bg-green-100" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe" alt="User" className="w-14 h-14 rounded-full border-4 border-[#FFFDFB] object-cover bg-purple-100" />
              <div className="w-14 h-14 rounded-full border-4 border-[#FFFDFB] bg-[#FF6B35] flex items-center justify-center text-white text-sm font-bold shadow-sm">
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
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
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
          className="absolute left-1/2 bottom-10 -translate-x-1/2 text-[#FF6B35]/20 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0L53 47L100 50L53 53L50 100L47 53L0 50L47 47L50 0Z" stroke="currentColor" strokeWidth="0.5" />
            <path d="M14.6 14.6L47.9 47.9L50 50L52.1 52.1L85.4 85.4M14.6 85.4L47.9 52.1L50 50L52.1 47.9L85.4 14.6" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
