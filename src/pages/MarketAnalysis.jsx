import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MarketAnalysis = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);

  // Mock market data - replace with real API calls
  useEffect(() => {
    const loadMarketData = async () => {
      // Simulate API call
      setTimeout(() => {
        setMarketData({
          trends: [
            { location: 'Lagos', trend: '+12%', direction: 'up', avgPrice: '₦45M' },
            { location: 'Abuja', trend: '+8%', direction: 'up', avgPrice: '₦38M' },
            { location: 'Port Harcourt', trend: '-2%', direction: 'down', avgPrice: '₦32M' },
            { location: 'Kano', trend: '+5%', direction: 'up', avgPrice: '₦28M' }
          ],
          insights: [
            'Property prices in Lagos have increased by 12% over the last quarter',
            'Abuja shows steady growth with 8% appreciation',
            'Port Harcourt market is stabilizing after recent corrections',
            'Kano emerging as a value investment opportunity'
          ],
          forecasts: [
            { period: 'Next 3 months', prediction: 'Continued growth in major cities' },
            { period: 'Next 6 months', prediction: 'Stabilization with moderate increases' },
            { period: 'Next year', prediction: '7-10% overall market appreciation' }
          ]
        });
        setLoading(false);
      }, 1500);
    };

    loadMarketData();
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
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Market Analysis</h1>
          <p className="text-gray-600">AI-powered insights into Nigeria's real estate market trends</p>
        </motion.div>

        {/* Market Trends Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {marketData.trends.map((trend, index) => (
            <motion.div
              key={trend.location}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2C3E50]">{trend.location}</h3>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  trend.direction === 'up' ? 'text-green-600' :
                  trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.direction === 'up' ? <ArrowUp size={16} /> :
                   trend.direction === 'down' ? <ArrowDown size={16} /> :
                   <Minus size={16} />}
                  {trend.trend}
                </div>
              </div>
              <p className="text-2xl font-bold text-[#FF6B35] mb-2">{trend.avgPrice}</p>
              <p className="text-sm text-gray-600">Average Property Price</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Market Insights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Key Insights */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
              <BarChart3 className="text-[#FF6B35]" />
              Key Market Insights
            </h2>
            <div className="space-y-3">
              {marketData.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#FF6B35] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Forecast */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
              <TrendingUp className="text-[#FF6B35]" />
              Market Forecast
            </h2>
            <div className="space-y-4">
              {marketData.forecasts.map((forecast, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-[#2C3E50] mb-1">{forecast.period}</h4>
                  <p className="text-sm text-gray-600">{forecast.prediction}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Investment Opportunities */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4 flex items-center gap-2">
            <DollarSign className="text-[#FF6B35]" />
            Investment Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-[#FF6B35] mb-2">₦2.5M - ₦5M</div>
              <p className="text-sm text-gray-600">Entry Level Properties</p>
              <p className="text-xs text-gray-500 mt-1">High rental yield potential</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-[#FF6B35] mb-2">₦5M - ₦15M</div>
              <p className="text-sm text-gray-600">Mid-Range Properties</p>
              <p className="text-xs text-gray-500 mt-1">Balanced risk-reward ratio</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-[#FF6B35] mb-2">₦15M+</div>
              <p className="text-sm text-gray-600">Luxury Properties</p>
              <p className="text-xs text-gray-500 mt-1">Premium locations, lower liquidity</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MarketAnalysis;
