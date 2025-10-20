import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Eye,
  Share2,
  Trash2,
  Download,
  RefreshCw,
  Save,
  Star,
  MapPin,
  Home,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ComparisonHistory = () => {
  const { user, isAuthenticated } = useAuth();
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    if (isAuthenticated) {
      loadComparisonHistory();
    }
  }, [isAuthenticated]);

  const loadComparisonHistory = async () => {
    try {
      setLoading(true);

      // Mock comparison history data
      const mockComparisons = [
        {
          id: 1,
          name: 'Lagos Luxury Properties',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          properties: [
            {
              id: 'prop1',
              title: 'Modern Apartment in VI',
              location: 'Victoria Island, Lagos',
              price: 3500000,
              bedrooms: 3,
              bathrooms: 2,
              area: 120,
              listing_type: 'for-rent'
            },
            {
              id: 'prop2',
              title: 'Luxury Villa in Lekki',
              location: 'Lekki Phase 1, Lagos',
              price: 25000000,
              bedrooms: 5,
              bathrooms: 4,
              area: 350,
              listing_type: 'for-sale'
            }
          ],
          comparisonType: 'investment',
          insights: {
            bestValue: 'prop1',
            bestInvestment: 'prop2',
            averagePrice: 14250000,
            priceRange: '₦3.5M - ₦25M'
          },
          saved: true,
          shared: false
        },
        {
          id: 2,
          name: 'Affordable Rentals',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          properties: [
            {
              id: 'prop3',
              title: 'Cozy Studio in Ikeja',
              location: 'Ikeja, Lagos',
              price: 1200000,
              bedrooms: 1,
              bathrooms: 1,
              area: 45,
              listing_type: 'for-rent'
            },
            {
              id: 'prop4',
              title: '1BR Apartment in Yaba',
              location: 'Yaba, Lagos',
              price: 1800000,
              bedrooms: 1,
              bathrooms: 1,
              area: 60,
              listing_type: 'for-rent'
            }
          ],
          comparisonType: 'rental',
          insights: {
            bestValue: 'prop3',
            bestInvestment: 'prop4',
            averagePrice: 1500000,
            priceRange: '₦1.2M - ₦1.8M'
          },
          saved: false,
          shared: true
        }
      ];

      setComparisons(mockComparisons);
    } catch (error) {
      console.error('Error loading comparison history:', error);
      toast.error('Failed to load comparison history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComparison = async (comparisonId) => {
    try {
      setComparisons(prev => prev.filter(c => c.id !== comparisonId));
      toast.success('Comparison deleted');
    } catch (error) {
      console.error('Error deleting comparison:', error);
      toast.error('Failed to delete comparison');
    }
  };

  const handleSaveComparison = async (comparisonId) => {
    try {
      setComparisons(prev =>
        prev.map(c =>
          c.id === comparisonId ? { ...c, saved: !c.saved } : c
        )
      );
      toast.success('Comparison saved');
    } catch (error) {
      console.error('Error saving comparison:', error);
      toast.error('Failed to save comparison');
    }
  };

  const handleShareComparison = async (comparisonId) => {
    try {
      const comparison = comparisons.find(c => c.id === comparisonId);
      if (comparison) {
        const shareText = `Property Comparison: ${comparison.name} - ${comparison.properties.length} properties compared`;
        const shareUrl = `${window.location.origin}/compare?session=${comparisonId}`;

        if (navigator.share) {
          await navigator.share({
            title: comparison.name,
            text: shareText,
            url: shareUrl
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Comparison link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing comparison:', error);
      toast.error('Failed to share comparison');
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getComparisonTypeIcon = (type) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'rental':
        return <Home className="w-4 h-4 text-blue-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredComparisons = comparisons.filter(comparison => {
    if (activeTab === 'saved') return comparison.saved;
    if (activeTab === 'shared') return comparison.shared;
    return true; // 'recent' tab shows all
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your comparison history</p>
        </div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparison History</h1>
                <p className="text-gray-600">View and manage your saved property comparisons</p>
              </div>
            </div>

            <button
              onClick={loadComparisonHistory}
              disabled={loading}
              className="flex items-center space-x-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'recent', label: 'Recent Comparisons', count: comparisons.length },
                { id: 'saved', label: 'Saved Comparisons', count: comparisons.filter(c => c.saved).length },
                { id: 'shared', label: 'Shared Comparisons', count: comparisons.filter(c => c.shared).length }
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
                  <span>{tab.label}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Comparisons List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FF6B35]"></div>
          </div>
        ) : filteredComparisons.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Comparisons Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {activeTab === 'saved'
                ? 'You haven\'t saved any comparisons yet. Start comparing properties to build your history.'
                : activeTab === 'shared'
                ? 'No shared comparisons found.'
                : 'Start comparing properties to see your history here.'}
            </p>
            <button
              onClick={() => window.location.href = '/compare'}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Start Comparing
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredComparisons.map((comparison) => (
              <motion.div
                key={comparison.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Comparison Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getComparisonTypeIcon(comparison.comparisonType)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{comparison.name}</h3>
                        <p className="text-sm text-gray-600">
                          {comparison.properties.length} properties • {formatTimeAgo(comparison.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {comparison.saved && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Saved
                        </span>
                      )}
                      {comparison.shared && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Shared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comparison Insights */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Best Value</div>
                      <div className="font-medium text-green-600">
                        {comparison.properties.find(p => p.id === comparison.insights.bestValue)?.title || 'N/A'}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Best Investment</div>
                      <div className="font-medium text-blue-600">
                        {comparison.properties.find(p => p.id === comparison.insights.bestInvestment)?.title || 'N/A'}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Price Range</div>
                      <div className="font-medium text-purple-600">
                        {comparison.insights.priceRange}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Properties Comparison */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparison.properties.map((property) => (
                      <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Home className="w-8 h-8 text-gray-400" />
                          </div>

                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{property.title}</h4>
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="text-sm">{property.location}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-[#FF6B35]">
                                ₦{property.price?.toLocaleString()}
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                property.listing_type === 'for-rent'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {property.listing_type === 'for-rent' ? 'For Rent' : 'For Sale'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                              <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
                              <span>{property.area} sq ft</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleSaveComparison(comparison.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          comparison.saved
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        <span className="text-sm">{comparison.saved ? 'Saved' : 'Save'}</span>
                      </button>

                      <button
                        onClick={() => handleShareComparison(comparison.id)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </button>

                      <button
                        onClick={() => window.location.href = `/compare?session=${comparison.id}`}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteComparison(comparison.id)}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Delete</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Comparison Analytics */}
        {comparisons.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Analytics</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF6B35] mb-1">
                  {comparisons.length}
                </div>
                <div className="text-sm text-gray-600">Total Comparisons</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {comparisons.filter(c => c.saved).length}
                </div>
                <div className="text-sm text-gray-600">Saved Comparisons</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {comparisons.reduce((sum, c) => sum + c.properties.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Properties Compared</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.round(comparisons.reduce((sum, c) => sum + (c.insights.averagePrice || 0), 0) / comparisons.length).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Avg. Property Value</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Comparison Insights</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Your most common comparison type is {comparisons.length > 0 ? 'investment' : 'rental'} properties</p>
                <p>• Average comparison includes {Math.round(comparisons.reduce((sum, c) => sum + c.properties.length, 0) / Math.max(comparisons.length, 1))} properties</p>
                <p>• Most valuable comparison was worth ₦{Math.max(...comparisons.map(c => c.insights.averagePrice || 0)).toLocaleString()}</p>
                <p>• Start a new comparison to add to your history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ComparisonHistory;
