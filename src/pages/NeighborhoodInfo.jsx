import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Home,
  School,
  ShoppingCart,
  Car,
  TreePine,
  Heart,
  Star,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NeighborhoodInfo = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState(null);

  // Mock neighborhood data - replace with real API calls
  useEffect(() => {
    const loadNeighborhoodData = async () => {
      // Simulate API call
      setTimeout(() => {
        setNeighborhoods([
          {
            name: 'Victoria Island',
            city: 'Lagos',
            rating: 4.8,
            avgPrice: '₦85M',
            trend: '+15%',
            amenities: ['Shopping Malls', 'International Schools', 'Fine Dining', 'Nightlife'],
            safety: 9.2,
            schools: 9.5,
            transport: 8.8,
            description: 'Premium residential and commercial area with high-end amenities and excellent infrastructure.'
          },
          {
            name: 'Lekki Phase 1',
            city: 'Lagos',
            rating: 4.6,
            avgPrice: '₦65M',
            trend: '+12%',
            amenities: ['Beaches', 'Golf Course', 'Shopping Centers', 'Restaurants'],
            safety: 8.5,
            schools: 8.9,
            transport: 8.2,
            description: 'Upscale residential neighborhood with modern developments and proximity to business districts.'
          },
          {
            name: 'Maitama',
            city: 'Abuja',
            rating: 4.7,
            avgPrice: '₦75M',
            trend: '+10%',
            amenities: ['Government Offices', 'Embassies', 'Hotels', 'Parks'],
            safety: 9.0,
            schools: 9.1,
            transport: 8.6,
            description: 'Prestigious district housing government officials and diplomats with excellent security.'
          },
          {
            name: 'GRA Port Harcourt',
            city: 'Port Harcourt',
            rating: 4.4,
            avgPrice: '₦45M',
            trend: '+8%',
            amenities: ['Oil Companies', 'Shopping Malls', 'Golf Club', 'Restaurants'],
            safety: 7.8,
            schools: 8.3,
            transport: 7.9,
            description: 'Government Reserved Area with established infrastructure and corporate presence.'
          }
        ]);
        setLoading(false);
      }, 1500);
    };

    loadNeighborhoodData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Neighborhood Guide</h1>
          <p className="text-gray-600">Discover the best neighborhoods for your lifestyle and investment goals</p>
        </motion.div>

        {/* Neighborhood Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {neighborhoods.map((neighborhood, index) => (
            <motion.div
              key={neighborhood.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-1">{neighborhood.name}</h3>
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPin size={16} />
                    {neighborhood.city}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-[#2C3E50]">{neighborhood.rating}</span>
                  </div>
                </div>
              </div>

              {/* Price and Trend */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Average Property Price</p>
                  <p className="text-2xl font-bold text-[#FF6B35]">{neighborhood.avgPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Market Trend</p>
                  <p className={`font-semibold flex items-center gap-1 ${
                    neighborhood.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp size={16} />
                    {neighborhood.trend}
                  </p>
                </div>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#2C3E50] mb-1">{neighborhood.safety}</div>
                  <div className="text-xs text-gray-600">Safety</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#2C3E50] mb-1">{neighborhood.schools}</div>
                  <div className="text-xs text-gray-600">Schools</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#2C3E50] mb-1">{neighborhood.transport}</div>
                  <div className="text-xs text-gray-600">Transport</div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-4">
                <h4 className="font-semibold text-[#2C3E50] mb-2">Key Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {neighborhood.amenities.map((amenity, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm leading-relaxed">
                {neighborhood.description}
              </p>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 bg-[#FF6B35] text-white py-3 rounded-lg font-semibold hover:bg-[#e85e2f] transition-colors"
              >
                View Properties in {neighborhood.name}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Investment Tips */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
            <Heart className="text-[#FF6B35]" />
            Investment Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Home className="w-8 h-8 text-[#FF6B35] mx-auto mb-3" />
              <h4 className="font-semibold text-[#2C3E50] mb-2">Location Matters</h4>
              <p className="text-sm text-gray-600">Choose neighborhoods with good infrastructure and proximity to amenities</p>
            </div>
            <div className="text-center">
              <School className="w-8 h-8 text-[#FF6B35] mx-auto mb-3" />
              <h4 className="font-semibold text-[#2C3E50] mb-2">Education Quality</h4>
              <p className="text-sm text-gray-600">Areas with good schools typically have higher property appreciation</p>
            </div>
            <div className="text-center">
              <Car className="w-8 h-8 text-[#FF6B35] mx-auto mb-3" />
              <h4 className="font-semibold text-[#2C3E50] mb-2">Transport Links</h4>
              <p className="text-sm text-gray-600">Easy access to major roads and public transport increases property value</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NeighborhoodInfo;
