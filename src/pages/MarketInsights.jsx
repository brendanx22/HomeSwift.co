import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Filter,
  Search,
  Globe,
  DollarSign,
  Home,
  Users,
  BarChart3,
  Target,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const MarketInsights = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('news');
  const [news, setNews] = useState([]);
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);

      // For now, we'll use mock data but could be extended with market insights tables
      // In a real implementation, this would load from market_news, market_trends, and market_insights tables
      const mockNews = [
        {
          id: 1,
          title: 'Lagos Property Market Shows Strong Growth in Q4 2024',
          excerpt: 'Recent data indicates a 12.5% increase in property values across Lagos metropolitan area, with Victoria Island leading the growth.',
          content: 'The Lagos real estate market continues to demonstrate resilience and growth potential. According to the latest market report, property values in the Victoria Island area have increased by 12.5% year-over-year, making it one of the most attractive investment destinations in Nigeria.',
          author: 'Market Research Team',
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          category: 'market-trends',
          image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
          readTime: '3 min read',
          tags: ['Lagos', 'Property Values', 'Investment'],
          views: 1247,
          featured: true
        },
        {
          id: 2,
          title: 'New Government Policies Impact Real Estate Investment',
          excerpt: 'Recent regulatory changes could affect property investment strategies for 2025.',
          content: 'The Nigerian government has introduced new policies that will impact real estate investments. Key changes include updated taxation guidelines and incentives for sustainable development projects.',
          author: 'Policy Analyst',
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          category: 'policy',
          image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
          readTime: '5 min read',
          tags: ['Government', 'Policy', 'Regulation'],
          views: 892,
          featured: false
        },
        {
          id: 3,
          title: 'Rise of Smart Homes in Nigerian Real Estate',
          excerpt: 'Technology integration is transforming how Nigerians buy and live in properties.',
          content: 'Smart home technology is becoming increasingly popular in Nigerian real estate. From automated security systems to energy-efficient appliances, technology is reshaping the property market.',
          author: 'Technology Reporter',
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          category: 'technology',
          image: 'https://images.unsplash.com/photo-1558002038-1055907df827',
          readTime: '4 min read',
          tags: ['Smart Homes', 'Technology', 'Innovation'],
          views: 634,
          featured: false
        }
      ];

      const mockTrends = [
        {
          id: 1,
          metric: 'Average Property Price',
          location: 'Lagos',
          current: 8500000,
          previous: 7800000,
          change: 8.97,
          trend: 'up',
          period: '30 days'
        },
        {
          id: 2,
          metric: 'Rental Yield',
          location: 'Abuja',
          current: 6.8,
          previous: 6.2,
          change: 9.68,
          trend: 'up',
          period: '30 days'
        },
        {
          id: 3,
          metric: 'Days on Market',
          location: 'Port Harcourt',
          current: 42,
          previous: 38,
          change: 10.53,
          trend: 'up',
          period: '30 days'
        },
        {
          id: 4,
          metric: 'New Listings',
          location: 'Kano',
          current: 156,
          previous: 142,
          change: 9.86,
          trend: 'up',
          period: '30 days'
        }
      ];

      const mockInsights = [
        {
          id: 1,
          type: 'opportunity',
          title: 'Investment Opportunity in Lekki',
          description: 'Lekki Phase 1 showing 15% year-over-year growth with strong rental demand.',
          impact: 'High',
          confidence: 85,
          action: 'Consider properties in Lekki Phase 1 for strong returns',
          icon: TrendingUp,
          color: 'green'
        },
        {
          id: 2,
          type: 'warning',
          title: 'Market Correction Expected',
          description: 'Overheated markets in certain areas may see price corrections in Q2 2025.',
          impact: 'Medium',
          confidence: 72,
          action: 'Monitor price trends closely and consider timing purchases',
          icon: AlertTriangle,
          color: 'yellow'
        },
        {
          id: 3,
          type: 'trend',
          title: 'Sustainable Properties Trending',
          description: 'Eco-friendly and energy-efficient properties seeing increased demand.',
          impact: 'Medium',
          confidence: 78,
          action: 'Properties with green certifications may command premium prices',
          icon: Award,
          color: 'blue'
        }
      ];

      setNews(mockNews);
      setTrends(mockTrends);
      setInsights(mockInsights);
    } catch (error) {
      console.error('Error loading market data:', error);
      toast.error('Failed to load market insights');

      // Fallback to original mock data
      const mockNews = [
        {
          id: 1,
          title: 'Lagos Property Market Shows Strong Growth in Q4 2024',
          excerpt: 'Recent data indicates a 12.5% increase in property values across Lagos metropolitan area.',
          content: 'The Lagos real estate market continues to demonstrate resilience and growth potential.',
          author: 'Market Research Team',
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          category: 'market-trends',
          image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
          readTime: '3 min read',
          tags: ['Lagos', 'Property Values', 'Investment'],
          views: 1247,
          featured: true
        }
      ];

      const mockTrends = [
        {
          id: 1,
          metric: 'Average Property Price',
          location: 'Lagos',
          current: 8500000,
          previous: 7800000,
          change: 8.97,
          trend: 'up',
          period: '30 days'
        }
      ];

      const mockInsights = [
        {
          id: 1,
          type: 'opportunity',
          title: 'Investment Opportunity in Lekki',
          description: 'Lekki Phase 1 showing 15% year-over-year growth with strong rental demand.',
          impact: 'High',
          confidence: 85,
          action: 'Consider properties in Lekki Phase 1 for strong returns',
          icon: TrendingUp,
          color: 'green'
        }
      ];

      setNews(mockNews);
      setTrends(mockTrends);
      setInsights(mockInsights);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Insights</h1>
                <p className="text-gray-600">Latest real estate news, trends, and market analysis</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search insights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent w-64"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="market-trends">Market Trends</option>
                <option value="policy">Policy & Regulation</option>
                <option value="technology">Technology</option>
                <option value="investment">Investment</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'news', label: 'Latest News', icon: Newspaper },
                { id: 'trends', label: 'Market Trends', icon: BarChart3 },
                { id: 'insights', label: 'AI Insights', icon: Target },
                { id: 'analysis', label: 'Market Analysis', icon: Zap }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#FF6B35] text-[#FF6B35]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Latest News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FF6B35]"></div>
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No News Found</h3>
                  <p className="text-gray-600">No articles match your current search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Featured Article */}
                  {filteredNews.find(article => article.featured) && (
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="relative h-64">
                          <img
                            src={filteredNews.find(article => article.featured).image}
                            alt={filteredNews.find(article => article.featured).title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-6 left-6 text-white">
                            <span className="px-3 py-1 bg-[#FF6B35] text-white text-sm rounded-full mb-2 inline-block">
                              Featured
                            </span>
                            <h2 className="text-2xl font-bold mb-2 line-clamp-2">
                              {filteredNews.find(article => article.featured).title}
                            </h2>
                            <p className="text-sm opacity-90 line-clamp-2">
                              {filteredNews.find(article => article.featured).excerpt}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regular Articles */}
                  {filteredNews.filter(article => !article.featured).map((article) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-48">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            article.category === 'market-trends' ? 'bg-blue-100 text-blue-800' :
                            article.category === 'policy' ? 'bg-green-100 text-green-800' :
                            article.category === 'technology' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {article.category.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <span>{article.author}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(article.publishedAt)}</span>
                            <span>•</span>
                            <span>{article.readTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{article.views}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {article.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center space-x-2">
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Bookmark className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Market Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trends.map((trend) => (
                  <motion.div
                    key={trend.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{trend.metric}</h3>
                      {getTrendIcon(trend.trend)}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600">{trend.location}</p>
                      <p className="text-xs text-gray-500">{trend.period}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current:</span>
                        <span className="font-medium">
                          {trend.metric.includes('Price') || trend.metric.includes('Yield')
                            ? `₦${trend.current.toLocaleString()}`
                            : trend.current}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Previous:</span>
                        <span className="font-medium">
                          {trend.metric.includes('Price') || trend.metric.includes('Yield')
                            ? `₦${trend.previous.toLocaleString()}`
                            : trend.previous}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-gray-600">Change:</span>
                        <span className={`font-medium ${getTrendColor(trend.trend)}`}>
                          {trend.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trend Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Key Observations</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Strong Growth in Lagos</p>
                          <p className="text-gray-600">Property values increasing steadily across Lagos metropolitan area</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Rental Market Healthy</p>
                          <p className="text-gray-600">Rental yields remain attractive for investors</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Market Normalization</p>
                          <p className="text-gray-600">Properties staying on market longer as supply increases</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Investment Implications</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <Target className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Buyer's Market Emerging</p>
                          <p className="text-gray-600">More negotiating power for buyers with increased inventory</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Long-term Growth Potential</p>
                          <p className="text-gray-600">Strong fundamentals support continued appreciation</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        insight.color === 'green' ? 'bg-green-100' :
                        insight.color === 'yellow' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <insight.icon className={`w-5 h-5 ${
                          insight.color === 'green' ? 'text-green-600' :
                          insight.color === 'yellow' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          insight.color === 'green' ? 'bg-green-100 text-green-800' :
                          insight.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {insight.type}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{insight.impact} Impact</p>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{insight.description}</p>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{insight.confidence}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            insight.confidence >= 80 ? 'bg-green-500' :
                            insight.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Recommendation:</p>
                      <p className="text-sm text-gray-600">{insight.action}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-start space-x-3">
                  <Info className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">How AI Insights Work</h3>
                    <div className="text-sm text-purple-800 space-y-1">
                      <p>• Analyzes millions of data points from property transactions</p>
                      <p>• Considers economic indicators, government policies, and market trends</p>
                      <p>• Uses machine learning to identify patterns and predict market movements</p>
                      <p>• Provides actionable insights for investors and homebuyers</p>
                      <p>• Updates in real-time as new data becomes available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Market Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Health Indicators</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Market Activity:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                        </div>
                        <span className="text-sm font-medium">High</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Price Stability:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }} />
                        </div>
                        <span className="text-sm font-medium">Stable</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Investment Demand:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '68%' }} />
                        </div>
                        <span className="text-sm font-medium">Growing</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Comparison</h3>

                  <div className="space-y-3">
                    {[
                      { city: 'Lagos', growth: 12.5, volume: 'High' },
                      { city: 'Abuja', growth: 8.9, volume: 'Medium' },
                      { city: 'Port Harcourt', growth: 6.2, volume: 'Medium' },
                      { city: 'Kano', growth: 4.8, volume: 'Low' }
                    ].map((region) => (
                      <div key={region.city} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{region.city}</p>
                          <p className="text-sm text-gray-600">Volume: {region.volume}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+{region.growth}%</p>
                          <p className="text-sm text-gray-600">Growth</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Forecast</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-green-600 mb-1">+8.5%</div>
                    <div className="text-sm text-gray-600">Expected Growth (Q1 2025)</div>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Home className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-blue-600 mb-1">2.3M</div>
                    <div className="text-sm text-gray-600">New Units (2025)</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-purple-600 mb-1">₦9.2M</div>
                    <div className="text-sm text-gray-600">Avg. Property Value</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-8 bg-gradient-to-r from-[#FF6B35] to-orange-500 rounded-lg p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated with Market Insights</h3>
            <p className="text-orange-100 mb-6 max-w-md mx-auto">
              Get the latest market trends, investment opportunities, and real estate news delivered to your inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
              />
              <button className="bg-white text-[#FF6B35] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>

            <p className="text-xs text-orange-200 mt-3">
              Unsubscribe at any time. We respect your privacy.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketInsights;
