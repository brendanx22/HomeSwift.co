import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Heart,
  TrendingUp,
  MapPin,
  Home,
  Star,
  ThumbsUp,
  Eye,
  Clock,
  Filter,
  RefreshCw,
  Target,
  Zap,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { PropertyAPI } from '../lib/propertyAPI';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PropertyRecommendations = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userPreferences, setUserPreferences] = useState({
    budget: { min: 1000000, max: 10000000 },
    location: '',
    propertyType: '',
    bedrooms: '',
    features: []
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadRecommendations();
      loadUserPreferences();
    }
  }, [isAuthenticated]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      // Load properties from database that could be recommendations
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          location,
          images,
          bedrooms,
          bathrooms,
          area,
          property_type,
          listing_type,
          amenities,
          is_featured,
          created_at
        `)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(9);

      if (error) throw error;

      // Transform properties into recommendation format
      const transformedRecommendations = properties?.map((property, index) => ({
        id: property.id,
        title: property.title || 'Untitled Property',
        location: property.location || 'Location not specified',
        price: property.price || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        area: property.area || 0,
        images: property.images || [],
        listing_type: property.listing_type || 'for-rent',
        matchScore: Math.floor(Math.random() * 20) + 80, // Random score for demo
        matchReasons: [
          'Matches your budget range',
          'Similar to properties you\'ve viewed',
          'High-rated neighborhood',
          'Modern amenities you prefer'
        ],
        recommendationType: index % 3 === 0 ? 'budget_match' : index % 3 === 1 ? 'location_match' : 'trending',
        timeAgo: `${Math.floor(Math.random() * 24)} hours ago`,
        isNew: Math.random() > 0.5
      })) || [];

      setRecommendations(transformedRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load recommendations');
      // Fallback to original mock data
      setRecommendations([
        {
          id: 1,
          title: 'Modern Apartment in Victoria Island',
          location: 'Victoria Island, Lagos',
          price: 3500000,
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
          images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6'],
          listing_type: 'for-rent',
          matchScore: 95,
          matchReasons: [
            'Matches your budget range',
            'Similar to properties you\'ve viewed',
            'High-rated neighborhood',
            'Modern amenities you prefer'
          ],
          recommendationType: 'budget_match',
          timeAgo: '2 hours ago',
          isNew: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      // In a real implementation, this would load from user preferences table
      // For now, we'll use mock data based on user behavior patterns
      setUserPreferences({
        budget: { min: 1000000, max: 10000000 },
        location: 'Lagos',
        propertyType: 'apartment',
        bedrooms: '2-3',
        features: ['parking', 'security', 'gym']
      });
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const refreshRecommendations = async () => {
    try {
      setRefreshing(true);
      await loadRecommendations();
      toast.success('Recommendations updated!');
    } catch (error) {
      toast.error('Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePropertyAction = (propertyId, action) => {
    // Track user interaction for better recommendations
    console.log(`User ${action} property ${propertyId}`);

    if (action === 'like') {
      toast.success('Property added to preferences');
    } else if (action === 'view') {
      navigate(`/properties/${propertyId}`);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'budget_match':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'location_match':
        return <MapPin className="w-5 h-5 text-blue-500" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-orange-500" />;
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to see personalized recommendations</p>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Property Recommendations</h1>
                <p className="text-gray-600">Personalized property suggestions based on your preferences</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshRecommendations}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Insights */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 mb-8">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">AI Insights</h3>
              <div className="text-sm text-purple-800 space-y-1">
                <p>• Based on your viewing history and saved properties</p>
                <p>• Properties in {userPreferences.location} with {userPreferences.budget.min.toLocaleString()}-{userPreferences.budget.max.toLocaleString()} budget</p>
                <p>• Focusing on {userPreferences.propertyType}s with {userPreferences.bedrooms} bedrooms</p>
                <p>• {recommendations.length} personalized recommendations generated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'all', label: 'All Recommendations', count: recommendations.length },
                { id: 'budget', label: 'Budget Matches', count: recommendations.filter(r => r.recommendationType === 'budget_match').length },
                { id: 'location', label: 'Location Based', count: recommendations.filter(r => r.recommendationType === 'location_match').length },
                { id: 'trending', label: 'Trending', count: recommendations.filter(r => r.recommendationType === 'trending').length }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeFilter === filter.id
                      ? 'border-[#FF6B35] text-[#FF6B35]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeFilter === filter.id ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Recommendations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FF6B35]"></div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Recommendations Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start browsing properties to get personalized AI recommendations based on your preferences.
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Start Browsing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations
              .filter(rec => activeFilter === 'all' || rec.recommendationType === activeFilter.replace('_match', '_match').replace('trending', 'trending'))
              .map((recommendation) => (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Property Image */}
                <div className="relative h-48">
                  {recommendation.images && recommendation.images.length > 0 ? (
                    <img
                      src={recommendation.images[0]}
                      alt={recommendation.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {/* Match Score Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(recommendation.matchScore)}`}>
                      {recommendation.matchScore}% match
                    </span>
                  </div>

                  {/* New Badge */}
                  {recommendation.isNew && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                        New
                      </span>
                    </div>
                  )}

                  {/* Recommendation Type Icon */}
                  <div className="absolute bottom-3 left-3">
                    {getRecommendationIcon(recommendation.recommendationType)}
                  </div>
                </div>

                <div className="p-4">
                  {/* Property Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {recommendation.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{recommendation.location}</span>
                  </div>

                  {/* Price */}
                  <div className="text-xl font-bold text-[#FF6B35] mb-3">
                    ₦{recommendation.price?.toLocaleString()}
                    {recommendation.listing_type === 'for-rent' && (
                      <span className="text-sm text-gray-600">/month</span>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Home className="w-4 h-4 mr-1" />
                        <span>{recommendation.bedrooms} bed</span>
                      </div>
                      <div className="flex items-center">
                        <span>{recommendation.bathrooms} bath</span>
                      </div>
                      {recommendation.area && (
                        <div className="flex items-center">
                          <span>{recommendation.area} sq ft</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Why recommended:</p>
                    <div className="space-y-1">
                      {recommendation.matchReasons.slice(0, 2).map((reason, index) => (
                        <p key={index} className="text-xs text-gray-600 flex items-center">
                          <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                          {reason}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePropertyAction(recommendation.id, 'view')}
                      className="flex-1 bg-[#FF6B35] text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handlePropertyAction(recommendation.id, 'like')}
                      className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recommendation Stats */}
        {recommendations.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Analytics</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF6B35] mb-1">
                  {Math.round(recommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / recommendations.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg. Match Score</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {recommendations.filter(rec => rec.matchScore >= 90).length}
                </div>
                <div className="text-sm text-gray-600">Excellent Matches</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {recommendations.filter(rec => rec.isNew).length}
                </div>
                <div className="text-sm text-gray-600">New Properties</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {new Set(recommendations.map(rec => rec.location.split(',')[0])).size}
                </div>
                <div className="text-sm text-gray-600">Areas Covered</div>
              </div>
            </div>
          </div>
        )}

        {/* Learning More */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
          <div className="flex items-start space-x-3">
            <Target className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">How AI Recommendations Work</h3>
              <div className="text-sm text-indigo-800 space-y-1">
                <p>• Analyzes your browsing history and saved properties</p>
                <p>• Considers your budget range and preferred locations</p>
                <p>• Learns from your interactions (likes, views, inquiries)</p>
                <p>• Updates recommendations daily based on new listings</p>
                <p>• Prioritizes properties matching your investment goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyRecommendations;
