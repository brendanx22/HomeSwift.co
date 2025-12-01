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
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Landlord Card */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-linear-to-r from-[#FF6B35] to-[#FF8C5A] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                
                <motion.div
                  className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-10 cursor-pointer hover:shadow-2xl transition-all duration-500 group-hover:scale-105"
                  onClick={() => handleUserTypeSelect('landlord')}
                  whileHover={{ y: -5 }}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-8">
                    <motion.div
                      className="w-24 h-24 bg-linear-to-br from-[#FF6B35] to-[#FF8C5A] rounded-3xl flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      <Building className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-[#2C3E50] mb-4">Property Owner</h2>
                    <p className="text-[#2C3E50]/60 mb-8 leading-relaxed text-lg">
                      List properties, manage tenants, track payments, and grow your rental business with powerful tools.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <DollarSign className="w-5 h-5 text-[#FF6B35]" />
                        <span>Maximize rental income</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <Shield className="w-5 h-5 text-[#FF6B35]" />
                        <span>Verified tenants only</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <Calendar className="w-5 h-5 text-[#FF6B35]" />
                        <span>Easy booking management</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <Star className="w-5 h-5 text-[#FF6B35]" />
                        <span>Build your reputation</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <motion.div
                      className="inline-flex items-center space-x-2 bg-[#FF6B35] text-white px-8 py-4 rounded-2xl font-semibold group-hover:bg-[#FF7B45] transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Start as Property Owner</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Renter Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-linear-to-r from-[#2C3E50] to-[#34495E] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                
                <motion.div
                  className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-10 cursor-pointer hover:shadow-2xl transition-all duration-500 group-hover:scale-105"
                  onClick={() => handleUserTypeSelect('renter')}
                  whileHover={{ y: -5 }}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-8">
                    <motion.div
                      className="w-24 h-24 bg-linear-to-br from-[#2C3E50] to-[#34495E] rounded-3xl flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: -5, scale: 1.1 }}
                    >
                      <Users className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-[#2C3E50] mb-4">Home Seeker</h2>
                    <p className="text-[#2C3E50]/60 mb-8 leading-relaxed text-lg">
                      Find your perfect home from verified listings, schedule tours, and connect directly with property owners.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <Search className="w-5 h-5 text-[#2C3E50]" />
                        <span>Smart property matching</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <Map className="w-5 h-5 text-[#2C3E50]" />
                        <span>Virtual tours available</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <Heart className="w-5 h-5 text-[#2C3E50]" />
                        <span>Save favorite properties</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 text-[#2C3E50]/70">
                        <CheckCircle className="w-5 h-5 text-[#2C3E50]" />
                        <span>Verified listings only</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <motion.div
                      className="inline-flex items-center space-x-2 bg-[#2C3E50] text-white px-8 py-4 rounded-2xl font-semibold group-hover:bg-[#34495E] transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Start Home Search</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
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
