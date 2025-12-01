import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building, Users, ArrowRight, Home, Search, DollarSign, Shield, Star, Map, Calendar, Heart, CheckCircle, Briefcase, Key } from 'lucide-react';
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
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
          className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
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
          className="max-w-4xl mx-auto w-full"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 mb-4"
            >
              Join HomeSwift Today
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-slate-600 max-w-2xl mx-auto"
            >
              Start your journey as a property owner or home seeker
            </motion.p>
          </div>

          {/* User Type Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Landlord Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Card Header */}
              <div className="bg-linear-to-r from-emerald-500 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 mx-auto">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-center">Property Owner</h2>
                <p className="text-emerald-50 text-center mt-2">List and manage your properties</p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Earn Rental Income</h3>
                      <p className="text-sm text-slate-600 mt-1">Maximize your property's earning potential with our platform</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Verified Tenants</h3>
                      <p className="text-sm text-slate-600 mt-1">Connect with pre-screened, reliable renters</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Easy Management</h3>
                      <p className="text-sm text-slate-600 mt-1">Streamlined booking and payment tracking</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={() => handleUserTypeSelect('landlord')}
                  className="w-full bg-emerald-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Get Started as Owner</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>

            {/* Renter Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Card Header */}
              <div className="bg-linear-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 mx-auto">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-center">Home Seeker</h2>
                <p className="text-blue-50 text-center mt-2">Find your perfect home</p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Search className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Smart Search</h3>
                      <p className="text-sm text-slate-600 mt-1">AI-powered matching to find your ideal home</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Map className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Virtual Tours</h3>
                      <p className="text-sm text-slate-600 mt-1">Explore properties from anywhere with 360° views</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Heart className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Save Favorites</h3>
                      <p className="text-sm text-slate-600 mt-1">Keep track of properties you love and get alerts</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={() => handleUserTypeSelect('renter')}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Start Home Search</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12 text-center"
          >
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>1000+ Properties</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Verified Listings</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Secure Platform</span>
              </div>
            </div>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-slate-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Sign in here
              </button>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default UserTypeSelection;
