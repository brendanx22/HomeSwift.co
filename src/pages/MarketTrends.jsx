import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Users,
  Target,
  Award,
  Activity,
  Eye,
  Clock,
  Filter,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const MarketTrends = () => {
  const { isAuthenticated } = useAuth();
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedLocation, setSelectedLocation] = useState('lagos');

  useEffect(() => {
    loadMarketTrends();
  }, [timeRange, selectedLocation]);

  const loadMarketTrends = async () => {
    try {
      setLoading(true);

      // For now, we'll use mock data but could be extended with market_trends table
      // In a real implementation, this would load from a market_trends table with real historical data
      const mockTrends = {
        overview: {
          medianPrice: 8500000,
          priceChange: 8.5,
          volume: 2341,
          volumeChange: 12.3,
          daysOnMarket: 45,
          inventory: 5234,
          marketHealth: 'hot'
        },
        priceTrends: {
          monthly: [
            { month: 'Jan', price: 8200000, volume: 180 },
            { month: 'Feb', price: 8250000, volume: 195 },
            { month: 'Mar', price: 8350000, volume: 210 },
            { month: 'Apr', price: 8400000, volume: 225 },
            { month: 'May', price: 8450000, volume: 240 },
            { month: 'Jun', price: 8500000, volume: 235 },
            { month: 'Jul', price: 8550000, volume: 250 },
            { month: 'Aug', price: 8600000, volume: 265 },
            { month: 'Sep', price: 8650000, volume: 280 },
            { month: 'Oct', price: 8700000, volume: 275 },
            { month: 'Nov', price: 8750000, volume: 290 },
            { month: 'Dec', price: 8800000, volume: 285 }
          ],
          yearly: [
            { year: '2020', price: 6500000 },
            { year: '2021', price: 7200000 },
            { year: '2022', price: 7800000 },
            { year: '2023', price: 8200000 },
            { year: '2024', price: 8500000 }
          ]
        },
        regionalData: [
          {
            location: 'Victoria Island',
            medianPrice: 15000000,
            change: 10.2,
            volume: 234,
            trend: 'up'
          },
          {
            location: 'Lekki Phase 1',
            medianPrice: 12000000,
            change: 8.7,
            volume: 456,
            trend: 'up'
          },
          {
            location: 'Ikeja',
            medianPrice: 6500000,
            change: 6.3,
            volume: 678,
            trend: 'up'
          },
          {
            location: 'Surulere',
            medianPrice: 4500000,
            change: 4.1,
            volume: 543,
            trend: 'up'
          },
          {
            location: 'Yaba',
            medianPrice: 3800000,
            change: 5.8,
            volume: 432,
            trend: 'up'
          }
        ],
        propertyTypes: [
          { type: 'Apartments', percentage: 45, avgPrice: 8500000, trend: 'up' },
          { type: 'Houses', percentage: 30, avgPrice: 15000000, trend: 'up' },
          { type: 'Condos', percentage: 15, avgPrice: 12000000, trend: 'stable' },
          { type: 'Townhouses', percentage: 10, avgPrice: 9500000, trend: 'up' }
        ],
        marketIndicators: {
          supplyDemand: 75,
          priceMomentum: 82,
          marketVelocity: 68,
          investorSentiment: 78
        }
      };

      setTrends(mockTrends);
    } catch (error) {
      console.error('Error loading market trends:', error);
      toast.error('Failed to load market trends');

      // Fallback to original mock data
      const mockTrends = {
        overview: {
          medianPrice: 8500000,
          priceChange: 8.5,
          volume: 2341,
          volumeChange: 12.3,
          daysOnMarket: 45,
          inventory: 5234,
          marketHealth: 'hot'
        },
        priceTrends: {
          monthly: [
            { month: 'Jan', price: 8200000, volume: 180 },
            { month: 'Feb', price: 8250000, volume: 195 }
          ],
          yearly: [
            { year: '2020', price: 6500000 },
            { year: '2021', price: 7200000 }
          ]
        },
        regionalData: [
          {
            location: 'Victoria Island',
            medianPrice: 15000000,
            change: 10.2,
            volume: 234,
            trend: 'up'
          }
        ],
        propertyTypes: [
          { type: 'Apartments', percentage: 45, avgPrice: 8500000, trend: 'up' }
        ],
        marketIndicators: {
          supplyDemand: 75,
          priceMomentum: 82,
          marketVelocity: 68,
          investorSentiment: 78
        }
      };

      setTrends(mockTrends);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : trend === 'down' ? (
      <TrendingDown className="w-4 h-4 text-red-600" />
    ) : (
      <Activity className="w-4 h-4 text-gray-600" />
    );
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Trends</h1>
                <p className="text-gray-600">Real-time market data and price analysis</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                <option value="3m">Last 3 months</option>
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
                <option value="2y">Last 2 years</option>
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                <option value="lagos">Lagos</option>
                <option value="abuja">Abuja</option>
                <option value="portharcourt">Port Harcourt</option>
                <option value="kano">Kano</option>
              </select>

              <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Median Price</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(trends.overview.medianPrice)}</p>
                <p className={`text-xs flex items-center mt-1 ${getTrendColor('up')}`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{trends.overview.priceChange}% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Volume</p>
                <p className="text-2xl font-bold text-gray-900">{trends.overview.volume.toLocaleString()}</p>
                <p className={`text-xs flex items-center mt-1 ${getTrendColor('up')}`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{trends.overview.volumeChange}% transactions
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Days on Market</p>
                <p className="text-2xl font-bold text-gray-900">{trends.overview.daysOnMarket}</p>
                <p className={`text-xs flex items-center mt-1 ${getTrendColor('down')}`}>
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -5 days avg.
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Health</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{trends.overview.marketHealth}</p>
                <p className="text-xs text-gray-500 mt-1">Based on current trends</p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Price Trends */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Trends (Monthly)</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {trends.priceTrends.monthly.map((data, index) => (
                <div key={data.month} className="flex flex-col items-center">
                  <div
                    className="w-8 bg-[#FF6B35] rounded-t"
                    style={{ height: `${(data.price / 10000000) * 100}%` }}
                  />
                  <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volume Trends */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {trends.priceTrends.monthly.map((data, index) => (
                <div key={data.month} className="flex flex-col items-center">
                  <div
                    className="w-8 bg-blue-500 rounded-t"
                    style={{ height: `${(data.volume / 300) * 100}%` }}
                  />
                  <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Regional Market Comparison</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trends.regionalData.map((region, index) => (
                <motion.div
                  key={region.location}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{region.location}</h4>
                    {getTrendIcon(region.trend)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Median Price:</span>
                      <span className="font-medium">{formatCurrency(region.medianPrice)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Change:</span>
                      <span className={`font-medium ${getTrendColor(region.trend)}`}>
                        {region.trend === 'up' ? '+' : ''}{region.change}%
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Volume:</span>
                      <span className="font-medium">{region.volume} transactions</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Property Type Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Type Distribution</h3>

            <div className="space-y-4">
              {trends.propertyTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      type.trend === 'up' ? 'bg-green-500' :
                      type.trend === 'down' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-gray-900">{type.type}</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          type.trend === 'up' ? 'bg-green-500' :
                          type.trend === 'down' ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{type.percentage}%</span>
                    <span className="text-sm text-gray-600 w-16">{formatCurrency(type.avgPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Indicators</h3>

            <div className="space-y-4">
              {Object.entries(trends.marketIndicators).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          value >= 80 ? 'bg-green-500' :
                          value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Forecast */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 mb-8">
          <div className="flex items-start space-x-3">
            <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Market Forecast & Predictions</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Property prices expected to grow 8-12% in the next 12 months</p>
                <p>• Rental demand remains strong with 6.5% average yield</p>
                <p>• Inventory levels stabilizing after recent surge</p>
                <p>• Prime locations showing strongest appreciation potential</p>
                <p>• Interest rate stability supporting continued growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Opportunities */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Opportunities</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center mb-2">
                <Award className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">High Growth Areas</span>
              </div>
              <p className="text-sm text-green-700">
                Victoria Island and Lekki Phase 1 showing exceptional growth potential with strong rental demand.
              </p>
            </div>

            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center mb-2">
                <Home className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Emerging Markets</span>
              </div>
              <p className="text-sm text-blue-700">
                Ikeja and Surulere offer good value with improving infrastructure and growing commercial activity.
              </p>
            </div>

            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-800">Cash Flow Focus</span>
              </div>
              <p className="text-sm text-purple-700">
                Properties in established areas offer stable rental income with lower appreciation but consistent returns.
              </p>
            </div>
          </div>
        </div>

        {/* Market Health Score */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Health Score</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">85</div>
              <div className="text-sm text-gray-600">Market Activity</div>
              <div className="text-xs text-green-600 mt-1">Very Active</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">72</div>
              <div className="text-sm text-gray-600">Price Stability</div>
              <div className="text-xs text-blue-600 mt-1">Stable</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">68</div>
              <div className="text-sm text-gray-600">Market Velocity</div>
              <div className="text-xs text-purple-600 mt-1">Moderate</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">78</div>
              <div className="text-sm text-gray-600">Investor Sentiment</div>
              <div className="text-xs text-orange-600 mt-1">Positive</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Market Health:</span>
              <span className="font-medium">76/100</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full" style={{ width: '76%' }} />
            </div>
            <p className="text-xs text-gray-600 mt-1">Good market conditions for both buyers and sellers</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketTrends;
