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
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PropertyAPI } from '../lib/propertyAPI';

const NeighborhoodInfo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState(null);

  useEffect(() => {
    const loadNeighborhoodData = async () => {
      try {
        setLoading(true);

        // Fetch all properties to generate neighborhood data
        const { success, properties } = await PropertyAPI.getProperties();

        if (success && properties && properties.length > 0) {
          // Group properties by location for neighborhood analysis
          const locationGroups = {};
          properties.forEach(property => {
            const location = property.location || 'Unknown';
            if (!locationGroups[location]) {
              locationGroups[location] = [];
            }
            locationGroups[location].push(property);
          });

          // Generate neighborhood data based on real properties
          const neighborhoodData = Object.entries(locationGroups).map(([location, props]) => {
            const prices = props.map(p => p.price || 0).filter(p => p > 0);
            const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

            // Calculate average ratings based on property features
            const totalBedrooms = props.reduce((sum, p) => sum + (p.bedrooms || p.rooms || 0), 0);
            const totalBathrooms = props.reduce((sum, p) => sum + (p.bathrooms || 0), 0);
            const totalArea = props.reduce((sum, p) => sum + (p.area || 0), 0);

            // Generate mock ratings for amenities (in real app, this would come from neighborhood data)
            const safety = Math.round((Math.random() * 2 + 7) * 10) / 10; // 7.0 - 9.0
            const schools = Math.round((Math.random() * 2 + 7) * 10) / 10; // 7.0 - 9.0
            const transport = Math.round((Math.random() * 2 + 7) * 10) / 10; // 7.0 - 9.0

            // Generate amenities based on location and property count
            const amenities = [];
            if (props.length > 5) amenities.push('Well-established area');
            if (totalBedrooms / props.length > 2) amenities.push('Spacious homes');
            if (totalBathrooms / props.length > 1.5) amenities.push('Modern facilities');
            if (Math.random() > 0.5) amenities.push('Good transport links');
            if (Math.random() > 0.6) amenities.push('Shopping nearby');

            // Calculate trend (mock for now)
            const trend = Math.random() > 0.3 ? (Math.random() > 0.5 ? '+10%' : '+8%') : '-2%';

            return {
              name: location,
              city: location.includes(',') ? location.split(',')[1]?.trim() : location,
              rating: Math.round((safety + schools + transport) / 3 * 10) / 10,
              avgPrice: `₦${(avgPrice / 1000000).toFixed(0)}M`,
              trend,
              amenities: amenities.slice(0, 4), // Show up to 4 amenities
              safety,
              schools,
              transport,
              description: `${location} offers ${props.length} properties with average prices around ₦${(avgPrice / 1000000).toFixed(0)}M. ${amenities[0] || 'A well-established residential area'}.`
            };
          }).slice(0, 4); // Show top 4 neighborhoods

          setNeighborhoods(neighborhoodData);
        } else {
          // Fallback to empty state if no properties
          setNeighborhoods([]);
        }
      } catch (error) {
        console.error('Error loading neighborhood data:', error);
        setNeighborhoods([]);
      } finally {
        setLoading(false);
      }
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
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Chat</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
          </div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Neighborhood Guide</h1>
          <p className="text-gray-600">Discover the best neighborhoods for your lifestyle and investment goals</p>
        </motion.div>

        {/* Neighborhood Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {neighborhoods.length > 0 ? neighborhoods.map((neighborhood, index) => (
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
          )) : (
            <div className="col-span-full bg-white rounded-xl p-12 text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Neighborhood Data Available</h3>
              <p className="text-gray-600">
                Neighborhood information will be available once properties are listed in different areas.
              </p>
            </div>
          )}
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
