import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  Home as HomeIcon, 
  Building2, 
  Palmtree, 
  Store,
  MessageSquare,
  Bot,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../components/PropertyCard';
import { PropertyAPI } from '../lib/propertyAPI';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('House');
  const [popularProperties, setPopularProperties] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    // Fetch some properties for the popular section
    const fetchProperties = async () => {
      // Use getFeaturedProperties to ensure we get valid, high-quality listings
      const { success, properties } = await PropertyAPI.getFeaturedProperties(3);
      if (success) {
        setPopularProperties(properties);
      } else {
        // Fallback to latest properties if featured fails
        const { success: searchSuccess, properties: searchProperties } = await PropertyAPI.searchProperties({});
        if (searchSuccess) {
           setPopularProperties(searchProperties.slice(0, 3));
        }
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?search=${encodeURIComponent(searchText)}`);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Buy', path: '/browse?type=sale' },
    { name: 'Rent', path: '/browse?type=rent' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
             <img src="/images/logo.png" alt="HomeSwift" className="h-8 md:h-10 w-auto" />
             {/* Fallback if logo fails */}
             {/* <span className="text-2xl font-bold text-[#FF6B35]">HomeSwift</span> */}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 bg-white/80 backdrop-blur-md px-8 py-3 rounded-full shadow-sm border border-white/50">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.path}
                className={`text-sm font-medium transition-colors ${link.name === 'Home' ? 'text-[#FF6B35]' : 'text-gray-600 hover:text-[#FF6B35]'}`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-gray-900 font-medium hover:text-[#FF6B35] transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/user-type')}
              className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-full font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Join
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-24 left-4 right-4 bg-white rounded-2xl shadow-xl p-6 md:hidden z-50 flex flex-col space-y-4"
            >
              {navLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.path}
                  className="text-lg font-medium text-gray-800 py-2 border-b border-gray-100"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col space-y-3 pt-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full py-3 border border-gray-200 rounded-xl font-semibold"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/user-type')}
                  className="w-full py-3 bg-[#FF6B35] text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20"
                >
                  Join
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-gradient-to-b from-blue-50/80 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold text-gray-500 mb-4 tracking-wide uppercase flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6B35]"></span>
             Smarten Home Search With AI
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#1F2937] leading-[1.1] mb-6">
              Tell Us What Kind Of Home<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-orange-400">
                You Want
              </span>
            </h1>
            <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Describe your dream home—cozy apartment, family house, or modern duplex. 
              HomeSwift AI understands and instantly connects you with the best options.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-[#FF6B35] transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-14 pr-16 py-5 rounded-full border-0 text-gray-900 shadow-xl shadow-blue-900/5 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#FF6B35] sm:text-lg transition-shadow"
                placeholder="Where do you want to live?"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 aspect-square bg-[#EFF6FF] text-[#FF6B35] rounded-full hover:bg-[#FF6B35] hover:text-white transition-all flex items-center justify-center"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </motion.div>

          {/* Hero Image */}
          <motion.div 
            className="mt-16 md:mt-24 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-[8px] border-white mx-auto max-w-5xl">
              <img 
                src="/images/hero-home.png" 
                alt="Modern Dream Home" 
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-1/2 -left-12 w-24 h-24 bg-orange-400/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 -right-12 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </header>

      {/* Social Proof / Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6 font-display">
              Trusted by <span className="text-[#FF6B35]">15,000+</span><br />
              Landlords and Renters
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#FF6B35] flex items-center justify-center text-white text-xs font-bold">
                  +2k
                </div>
              </div>
              
              <button onClick={() => navigate('/browse')} className="group flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#FF6B35] transition-colors">
                <span>See Verified reviews</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8">
             <div className="bg-orange-50 rounded-2xl p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Star className="w-24 h-24 text-[#FF6B35]" />
               </div>
               <p className="text-[#FF6B35] font-semibold text-sm mb-3 uppercase tracking-wider">Our Mission</p>
               <h4 className="text-xl md:text-2xl font-medium text-gray-900 leading-snug">
                 We are a tech-driven real estate platform connecting landlords and renters directly. 
                 <span className="text-[#FF6B35]"> Our goal is to make finding and renting homes faster, transparent, and stress-free with smart AI and verified listings.</span>
               </h4>
             </div>
             
             {/* Stats Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Customer Satisfaction", value: "98%" },
                  { label: "Verified Listings", value: "12K+" },
                  { label: "Successful Rentals", value: "8K+" },
                  { label: "Active Users", value: "15K+" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase">{stat.label}</div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* AI Feature Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 flex flex-col md:flex-row items-center gap-12 overflow-hidden border border-gray-100">
            {/* Image Side */}
            <div className="w-full md:w-1/2 relative min-h-[400px] bg-gray-100 rounded-3xl flex items-center justify-center p-8">
               {/* Abstract Phone UI Representation */}
               <div className="relative w-64 h-[500px] bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-900 overflow-hidden transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                  <div className="absolute top-0 left-0 w-full h-8 bg-gray-900 rounded-b-xl z-20"></div>
                  <div className="p-4 pt-12 space-y-4 bg-gray-50 h-full">
                     <div className="h-32 bg-blue-100 rounded-2xl w-full animate-pulse"></div>
                     <div className="space-y-2">
                       <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                       <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                     </div>
                     <div className="h-20 bg-orange-100 rounded-2xl w-full flex items-center p-3 gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">🔥</div>
                        <div className="text-xs text-gray-600">Hot Deal Alert! <br/> <span className="font-bold text-gray-900">50% Off First Month</span></div>
                     </div>
                  </div>
               </div>
               
               {/* Floating Badges */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute top-20 left-10 bg-white p-3 rounded-2xl shadow-lg flex items-center gap-3"
               >
                 <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-[#FF6B35]">
                   <CheckCircle2 size={20} />
                 </div>
                 <div>
                   <p className="text-xs text-gray-500">Verification</p>
                   <p className="text-sm font-bold">100% Secure</p>
                 </div>
               </motion.div>

               <motion.div 
                 animate={{ y: [0, 10, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute bottom-20 right-10 bg-white p-3 rounded-2xl shadow-lg flex items-center gap-3"
               >
                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                   <Zap size={20} />
                 </div>
                 <div>
                   <p className="text-xs text-gray-500">Speed</p>
                   <p className="text-sm font-bold">Instantly Matched</p>
                 </div>
               </motion.div>
            </div>

            {/* Content Side */}
            <div className="w-full md:w-1/2">
              <span className="text-[#FF6B35] font-semibold tracking-wider text-sm uppercase mb-2 block">AI Powered</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Find Your Next Home <br/>
                <span className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full text-[#FF6B35] text-2xl md:text-4xl">
                  <Bot size={32} /> With AI 
                </span>
                <br/> at a Fraction of The Usual Cost.
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Save valuable hours and vast amounts of cash by switching to our smart AI. 
                Our Tenant Protection program ensures that every transaction is safe, secure, 
                and scam-free. Get personalized listings delivered straight to you.
              </p>
              
              <button 
                onClick={() => navigate('/about')}
                className="group flex items-center gap-2 text-lg font-semibold text-[#FF6B35] hover:gap-4 transition-all"
              >
                Learn more <ArrowRight className="w-5 h-5 group-hover:bg-orange-100 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Listings Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <span className="text-[#FF6B35] font-semibold tracking-wider text-sm uppercase block mb-1">Hot Deals</span>
              <h2 className="text-3xl font-bold text-gray-900">Popular Listings</h2>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-xl">
              {[
                { name: 'House', icon: HomeIcon },
                { name: 'Penthouse', icon: Building2 },
                { name: 'Villa', icon: Palmtree },
                { name: 'Shop/Office', icon: Store },
              ].map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.name 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {popularProperties.length > 0 ? (
                popularProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))
             ) : (
                // Skeleton Loaders / Placeholders
                [1, 2, 3].map((i) => (
                   <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                      <div className="h-48 bg-gray-200 animate-pulse"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        <div className="flex justify-between pt-2">
                           <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                           <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </div>
                      </div>
                   </div>
                ))
             )}
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => navigate('/browse')}
              className="px-8 py-3 border-2 border-gray-200 rounded-full font-semibold text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
            >
              View All Properties
            </button>
          </div>
        </div>
      </section>

      {/* Prime Tools Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="text-[#FF6B35] font-semibold tracking-wider text-sm uppercase block mb-1">Our Features</span>
            <h2 className="text-3xl font-bold text-gray-900">Prime Tools</h2>
            <p className="text-gray-500 mt-4">Pick the perfect digital assistant for your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             {/* Home AI Tool */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden" onClick={() => navigate('/browse')}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-150 duration-500"></div>
               <div className="relative z-10 flex items-start justify-between">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Smart Search</h3>
                    <p className="text-gray-600 mb-6 max-w-xs">Instantly search properties via location, price, and amenities.</p>
                    <span className="text-[#FF6B35] font-medium group-hover:underline">Try Now -></span>
                 </div>
                 <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-[#FF6B35] group-hover:rotate-12 transition-transform">
                   <Search size={32} />
                 </div>
               </div>
            </div>

            {/* HomeMate Tool */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden" onClick={() => navigate('/chat')}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-150 duration-500"></div>
               <div className="relative z-10 flex items-start justify-between">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">HomeMate AI</h3>
                    <p className="text-gray-600 mb-6 max-w-xs">Your personal real estate assistant. Ask questions, get advice.</p>
                    <span className="text-[#FF6B35] font-medium group-hover:underline">Chat Now -></span>
                 </div>
                 <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-transform">
                   <MessageSquare size={32} />
                 </div>
               </div>
               
               {/* 3D Character Decoration (Optional, using emoji for now) */}
               <div className="absolute -bottom-4 right-4 text-8xl opacity-20 filter grayscale group-hover:grayscale-0 transition-all">
                  🤖
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-white border-t border-gray-100">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Ready to find your dream home?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/user-type')} className="px-8 py-4 bg-[#FF6B35] text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 hover:-translate-y-1">
                Get Started Now
              </button>
              <button onClick={() => navigate('/contact')} className="px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-bold text-lg hover:bg-gray-200 transition-all">
                Contact Support
              </button>
            </div>
         </div>
      </section>
    </div>
  );
};

export default Home;
