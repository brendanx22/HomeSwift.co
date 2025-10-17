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
    // Handle search logic here
    console.log('Searching for:', searchText);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/user-type');
  };

  return (
    <div 
      className="min-h-[70vh] sm:min-h-screen w-full bg-cover bg-center hero-container flex flex-col"
      style={{
        backgroundImage: 'url("/images/Illustration.png")',
        backgroundColor: '#ffffff',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center 110%',
        backgroundSize: 'contain',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .hero-container {
            background-position: center 80% !important;
            background-size: contain !important;
            padding-bottom: 0 !important;
            background-attachment: scroll !important;
          }
          .logo-img {
            width: 160px !important;
            margin-left: auto !important;
            margin-right: auto !important;
{{ ... }}
            height: auto !important;
          }
        }
      `}</style>
      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12 w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex items-center space-x-3 ml-4 mt-4">
          <img src="/images/logo.png" alt="HomeSwift Logo" className="logo-img w-60 h-10 rounded-lg object-cover" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-[#2C3E50] text-md font-medium border-b-2 border-[#FF6B35] pb-1">Home</a>
          <a href="#" className="text-[#2C3E50]/80 text-md hover:text-[#FF6B35] transition-colors">FAQs</a>
          <a href="#" className="text-[#2C3E50]/80 text-md hover:text-[#FF6B35] transition-colors">About Us</a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <motion.button
            onClick={handleGetStartedClick}
            className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-2 rounded-full font-medium hover:bg-[#FF7B45] transition-colors"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
            onClick={handleLoginClick}
            className="bg-transparent border border-gray-400 text-[#2C3E50] px-6 py-2 rounded-full font-medium hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Login
          </motion.button>
          <motion.a
            href="/waitlist"
            className="bg-[#2C3E50] text-white px-6 py-2 rounded-full font-medium hover:bg-[#1E2B38] transition-colors flex items-center space-x-2"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span>Join Waitlist</span>
            <Sparkles size={16} className="text-[#FF6B35]" />
          </motion.a>
        </div>
      
        {/* Mobile Menu Button */}
        <motion.button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden text-[#FF6B35] p-2"
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            className="md:hidden absolute top-20 left-0 right-0 bg-[#FF6B35]/90 backdrop-blur-md border-t border-gray-400/50 z-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-4">
              <a href="#" className="block text-white text-lg font-medium border-b-2 border-white pb-1 w-fit">Home</a>
              <a href="#" className="block text-gray-300 text-lg hover:text-white transition-colors">FAQs</a>
              <a href="#" className="block text-gray-300 text-lg hover:text-white transition-colors">About Us</a>
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={handleGetStartedClick}
                className="w-full flex items-center justify-center space-x-2 bg-white text-[#2C3E50] px-4 py-2 rounded-2xl font-medium hover:bg-gray-100 transition-colors"
              >
                <span>Get Started</span>
                <div className="w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center">
                  <ArrowRight size={10} className="text-white" />
                </div>
              </button>
              <button
                onClick={handleLoginClick}
                className="w-full bg-transparent border border-gray-400 text-white px-6 py-2 rounded-2xl font-medium hover:bg-white/10 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Feature Tag */}
        <motion.div
          className="flex items-center space-x-2 bg-[#FF6B35] rounded-[2rem] px-6 py-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -2 }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <span className="text-white text-sm font-medium">Smarter, faster, simpler home search</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          className="text-center mb-6 sm:mb-10 max-w-4xl text-3xl md:text-4xl lg:text-5xl text-[#2C3E50] leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        >
          Tell Us What Kind Of<br />
          Home You Want
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          className="text-sm md:text-sm text-[#FF6B35] mb-16 max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
        >
        Describe your dream home—cozy apartment, family house, or modern duplex. HomeSwift AI understands and instantly connects you with the best options.
        </motion.p>

        {/* Search Input */}
        <motion.div
          className="w-full max-w-xl"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.7 }}
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
                             <input
                 type="text"
                 value={searchText}
                 onChange={(e) => setSearchText(e.target.value)}
                 placeholder="Describe your ideal home"
                 className="w-full bg-transparent border border-[#2C3E50] rounded-full px-6 py-6 text-white text-md placeholder-[#404040] focus:outline-none focus:border-gray-300 focus:bg-white/5 transition-all"
               />
                             <motion.button
               type="submit"
               className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-[#FF6B35] px-3 py-3 rounded-full"
             >
              <ArrowUp size={20}/>
            </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;
