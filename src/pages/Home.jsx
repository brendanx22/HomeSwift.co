import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowRight, ArrowUpRight, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useScroll } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [searchText, setSearchText] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    <div className="bg-white">
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

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div
                className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowMobileMenu(false)}
              />
              <motion.div
                className="md:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-40 overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
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
                <div className="p-6 space-y-8">
                  <nav className="space-y-2">
                    <a 
                    href="/" 
                    className="block px-4 py-3 text-[#2C3E50] text-lg font-semibold bg-gray-50 rounded-lg border-l-4 border-[#FF6B35]"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </a>
                    <a href="/faq" className="block px-4 py-3 text-[#2C3E50]/70 text-lg hover:text-[#FF6B35]">FAQs</a>
                    <a href="/about" className="block px-4 py-3 text-[#2C3E50]/70 text-lg hover:text-[#FF6B35]">About Us</a>
                  </nav>
                  <div className="space-y-3">
                    <motion.button
                      onClick={(e) => { handleGetStartedClick(e); setShowMobileMenu(false); }}
                      className="w-full flex items-center justify-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      <span>Get Started</span>
                      <ArrowRight size={14} />
                    </motion.button>
                    <motion.button
                      onClick={(e) => { handleLoginClick(e); setShowMobileMenu(false); }}
                      className="w-full bg-white border-2 border-[#2C3E50] text-[#2C3E50] px-6 py-3 rounded-xl font-semibold"
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
        <motion.main 
          className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 text-center"
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        >
          {/* Feature Tag */}
          <motion.div
            className="flex items-center space-x-2 bg-blue-50/40 backdrop-blur-md border border-white/30 shadow-xs rounded-full px-4 py-1.5 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          >
            <Sparkles className="w-3 h-3 text-[#2C3E50]/70" />
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
            className="w-full max-w-md"
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
                <motion.div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#2C3E50]/40">
                  <Sparkles size={20} />
                </motion.div>
              </div>
            </form>
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

      {/* Who are we? Section */}
      <section className="bg-white py-32 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center space-x-2 bg-[#FF6B35]/10 rounded-full px-4 py-1.5 mb-12"
          >
            <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />
            <span className="text-[#FF6B35] text-xs font-bold tracking-wider uppercase">Who are we?</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1C2C3E] leading-[1.3] max-w-5xl mb-24 tracking-tight"
          >
            We are a tech-driven real estate <span className="text-[#3498DB]">platform connecting</span> landlords and renters directly. Our goal is to <span className="text-[#3498DB]">make finding</span> and renting homes faster, transparent, and stress-free with smart AI and verified listings.
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {[1, 2, 3].map((num) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: num * 0.1, duration: 0.6 }}
                className="rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-xl shadow-gray-200/50"
              >
                <img 
                  src={`/images/house-${num}.png`} 
                  alt={`Modern Home ${num}`} 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Achievements Section */}
      <section className="bg-white py-32 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center space-x-2 bg-[#FF6B35]/10 rounded-full px-4 py-1.5 mb-24"
          >
            <span className="text-[#FF6B35] text-xs font-bold tracking-wider uppercase">Our Achievements</span>
            <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {[
              { label: 'Customer Satisfaction', val: '98%' },
              { label: 'Verified Listings', val: '12K+' },
              { label: 'Successful Rentals', val: '8K+' },
              { label: 'Active Users', val: '15K+' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50/50 backdrop-blur-sm rounded-3xl p-10 flex flex-col items-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100/50"
              >
                <span className="text-5xl font-bold text-[#1C2C3E] mb-3">{stat.val}</span>
                <span className="text-[#1C2C3E]/50 text-sm font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us / AI Search Section */}
      <section className="bg-white py-32 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Left: Floating Cards Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-[3rem] overflow-hidden aspect-[1/1.1] relative shadow-2xl">
              <img 
                src="/images/house-1.png" 
                alt="AI Driven Homes" 
                className="w-full h-full object-cover grayscale-[0.2] brightness-90" 
              />
              <div className="absolute inset-0 bg-linear-to-t from-gray-900/40 to-transparent" />
              
              {/* Floating Outcome Cards */}
              <div className="absolute inset-0 p-8 flex flex-col justify-center space-y-6">
                {[
                  {
                    title: 'HomeSwift (Outcome)',
                    desc: 'Renting in days, not months, at 2% transaction fee vs 10%+ agency fees',
                  },
                  {
                    title: 'HomeSwift (Outcome)',
                    desc: 'Cut renting costs 80% with direct landlord access, no hidden fees.',
                  },
                  {
                    title: 'HomeSwift (Outcome)',
                    desc: 'Get personalized home matches in seconds, tailored to your needs',
                  },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + (i * 0.2) }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/20 flex items-start space-x-4 max-w-sm"
                    style={{ marginLeft: i * 20 }}
                  >
                    <div className="bg-[#FF6B35] p-3 rounded-xl flex-shrink-0">
                      <img src="/images/logo.png" className="w-6 h-6 object-contain brightness-0 invert" alt="" />
                    </div>
                    <div>
                      <h4 className="text-[#1C2C3E] font-bold text-sm mb-1">{card.title}</h4>
                      <p className="text-[#1C2C3E]/70 text-xs leading-relaxed font-medium">
                        {card.desc.split('at 2%').map((part, idx) => idx === 0 ? part : <><span className="text-[#1C2C3E] font-bold">at 2% transaction fee</span>{part}</>)}
                        {card.desc.includes('80%') && card.desc.split('80%').map((part, idx) => idx === 0 ? part : <><span className="text-[#1C2C3E] font-bold">80% with direct landlord access</span>{part}</>)}
                        {card.desc.includes('matches in seconds') && card.desc.split('matches in seconds').map((part, idx) => idx === 0 ? part : <><span className="text-[#1C2C3E] font-bold">home matches in seconds</span>{part}</>)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-2 bg-[#FF6B35]/10 rounded-full px-4 py-1.5 mb-8 w-fit">
              <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />
              <span className="text-[#FF6B35] text-xs font-bold tracking-wider uppercase">About Us</span>
            </div>

            <h3 className="text-4xl md:text-5xl font-semibold text-[#1C2C3E] leading-[1.2] mb-8 tracking-tight">
              Find Your Next Home 
              <span className="inline-flex items-center -space-x-2 mx-3">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=A" className="w-10 h-10 rounded-full border-2 border-white bg-blue-100" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=B" className="w-10 h-10 rounded-full border-2 border-white bg-green-100" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#FF6B35] flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
              </span>
              With AI, at a Fraction of The Usual Cost.
            </h3>

            <p className="text-[#1C2C3E]/60 text-lg leading-relaxed mb-12 font-medium">
              Find verified homes fast, talk directly to landlords, and move in without delays or heavy fees. HomeSwift streamlines your entire renting journey with AI-guided search, real-time communication, secure verification, and a seamless experience designed to save you time, stress, and money.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-[#FF6B35] text-[#FF6B35] px-10 py-4 rounded-full font-bold hover:bg-[#FF6B35] hover:text-white transition-all duration-300 flex items-center group"
            >
              Learn More <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
