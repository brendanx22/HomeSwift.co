import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building, Users, ArrowRight, Home, Search, DollarSign, Shield, Star, Map, Calendar, Heart, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const UserTypeSelection = () => {
  const navigate = useNavigate();

  const handleUserTypeSelect = async (userType) => {
    try {
      // Save user type to localStorage
      localStorage.setItem('userType', userType);
      
      // Log to console for debugging
      console.log(`User selected: ${userType}`);
      
      // Navigate to the appropriate login page
      if (userType === 'renter') {
        navigate('/login');
      } else if (userType === 'landlord') {
        navigate('/landlord/login');
      }
      
    } catch (error) {
      console.error('Error saving user type:', error);
    }
  };
  
  // Check Supabase connection
  React.useEffect(() => {
    const checkSupabase = async () => {
      const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('Supabase connected successfully!', data);
      }
    };
    
    checkSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#FF6B35]/5 via-white to-[#2C3E50]/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#FF6B35] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#2C3E50] rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-16"
        >
          <div className="flex items-center">
            <img src="/images/logo.png" alt="HomeSwift Logo" className="w-40 h-8 object-cover rounded-lg" />
          </div>
          <motion.button
            onClick={() => navigate('/')}
            className="text-[#2C3E50]/70 hover:text-[#2C3E50] font-medium transition-colors"
            whileHover={{ x: -5 }}
          >
            ← Back to Home
          </motion.button>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto w-full"
          >
            {/* Hero Section */}
            <div className="text-center mb-16">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl md:text-6xl font-bold text-[#2C3E50] mb-6 leading-tight"
              >
                How Will You Use
                <span className="text-[#FF6B35]"> HomeSwift?</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl text-[#2C3E50]/70 max-w-3xl mx-auto leading-relaxed"
              >
                Join thousands of Nigerians finding their perfect homes or growing their rental business with our trusted platform.
              </motion.p>
            </div>

            {/* User Type Cards */}
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {/* Landlord Card */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  className="relative w-64 h-64 cursor-pointer group"
                  onClick={() => handleUserTypeSelect('landlord')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-linear-to-br from-[#FF6B35]/20 to-[#FF8C5A]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"></div>
                  
                  {/* Main Card */}
                  <div className="relative w-full h-full bg-linear-to-br from-[#FF6B35] to-[#FF8C5A] rounded-full shadow-xl flex flex-col items-center justify-center p-8 border-4 border-white group-hover:shadow-2xl transition-all duration-300">
                    {/* Icon */}
                    <motion.div
                      className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      <Building className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Content */}
                    <div className="text-center text-white">
                      <h2 className="text-2xl font-bold mb-2">Property Owner</h2>
                      <p className="text-white/90 text-sm leading-relaxed mb-4">
                        List properties & grow your rental business
                      </p>
                      
                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-center space-x-2 text-xs text-white/80">
                          <DollarSign className="w-4 h-4" />
                          <span>Maximize income</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs text-white/80">
                          <Shield className="w-4 h-4" />
                          <span>Verified tenants</span>
                        </div>
                      </div>

                      {/* Arrow Indicator */}
                      <motion.div
                        className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Renter Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  className="relative w-64 h-64 cursor-pointer group"
                  onClick={() => handleUserTypeSelect('renter')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-linear-to-br from-[#2C3E50]/20 to-[#34495E]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"></div>
                  
                  {/* Main Card */}
                  <div className="relative w-full h-full bg-linear-to-br from-[#2C3E50] to-[#34495E] rounded-full shadow-xl flex flex-col items-center justify-center p-8 border-4 border-white group-hover:shadow-2xl transition-all duration-300">
                    {/* Icon */}
                    <motion.div
                      className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4"
                      whileHover={{ rotate: -5, scale: 1.1 }}
                    >
                      <Users className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Content */}
                    <div className="text-center text-white">
                      <h2 className="text-2xl font-bold mb-2">Home Seeker</h2>
                      <p className="text-white/90 text-sm leading-relaxed mb-4">
                        Find your perfect home from verified listings
                      </p>
                      
                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-center space-x-2 text-xs text-white/80">
                          <Search className="w-4 h-4" />
                          <span>Smart matching</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs text-white/80">
                          <Map className="w-4 h-4" />
                          <span>Virtual tours</span>
                        </div>
                      </div>

                      {/* Arrow Indicator */}
                      <motion.div
                        className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="flex flex-wrap justify-center items-center gap-8 text-[#2C3E50]/60">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>1000+ Properties</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Verified Owners</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </motion.div>

            {/* Footer Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-12 text-center"
            >
              <p className="text-[#2C3E50]/60">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#FF6B35] hover:text-[#FF7B45] font-semibold transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserTypeSelection;
