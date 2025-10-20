import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  School,
  Shield,
  ShoppingCart,
  Car,
  TreePine,
  Hospital,
  Utensils,
  Home,
  Users,
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const NeighborhoodAnalytics = ({ location = 'Lagos, Nigeria' }) => {
  const { isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadNeighborhoodData();
  }, [location]);

  const loadNeighborhoodData = async () => {
    try {
      setLoading(true);

      // Load neighborhood data from database
      const { data: neighborhoodData, error } = await supabase
        .from('neighborhood_data')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (neighborhoodData) {
        // Transform database data into analytics format
        const transformedAnalytics = {
          overview: {
            name: neighborhoodData.name || 'Unknown Neighborhood',
            city: 'Lagos',
            state: 'Lagos State',
            population: neighborhoodData.population || 125000,
            medianAge: 32,
            averageIncome: 4500000,
            crimeRate: neighborhoodData.safety_score >= 80 ? 'Low' : neighborhoodData.safety_score >= 60 ? 'Medium' : 'High',
            crimeScore: neighborhoodData.safety_score || 85,
            schoolRating: neighborhoodData.school_rating || 4.2,
            walkScore: 78,
            transitScore: 65,
            bikeScore: 45,
            propertyValue: neighborhoodData.average_price || 8500000,
            priceGrowth: 12.5,
            rentalYield: 6.8
          },
          safety: {
            overall: neighborhoodData.safety_score || 85,
            violentCrime: 15,
            propertyCrime: 25,
            trafficIncidents: 45,
            emergencyResponse: 8.5,
            policeStations: 3,
            hospitals: 2,
            fireStations: 1,
            trends: [
              { month: 'Jan', rate: 22 },
              { month: 'Feb', rate: 20 },
              { month: 'Mar', rate: 18 },
              { month: 'Apr', rate: 16 },
              { month: 'May', rate: 15 },
              { month: 'Jun', rate: 14 }
            ]
          },
          education: {
            averageRating: neighborhoodData.school_rating || 4.2,
            totalSchools: 12,
            elementary: 4,
            middle: 3,
            high: 3,
            universities: 2,
            topSchools: [
              { name: 'Victoria Island International School', rating: 4.8, type: 'Private' },
              { name: 'Lagos State Model College', rating: 4.5, type: 'Public' },
              { name: 'British International School', rating: 4.7, type: 'Private' }
            ]
          },
          amenities: {
            restaurants: 45,
            cafes: 23,
            shopping: 67,
            parks: 8,
            gyms: 12,
            entertainment: 15,
            walkability: 78,
            nearbyAmenities: neighborhoodData.poi?.slice(0, 3)?.map(poi => ({
              name: poi.name || 'Unknown Amenity',
              type: poi.category || 'General',
              distance: '0.5 km'
            })) || [
              { name: 'Victoria Island Mall', type: 'Shopping', distance: '0.5 km' },
              { name: 'Lagos Yacht Club', type: 'Entertainment', distance: '1.2 km' },
              { name: 'Victoria Island Park', type: 'Recreation', distance: '0.8 km' }
            ]
          },
          market: {
            medianPrice: neighborhoodData.average_price || 8500000,
            pricePerSqft: 8500,
            daysOnMarket: 45,
            inventory: 234,
            priceGrowth: 12.5,
            rentalRates: {
              studio: 1200000,
              oneBed: 1800000,
              twoBed: 2500000,
              threeBed: 3500000
            }
          },
          demographics: {
            ageDistribution: [
              { age: '0-18', percentage: 22, color: '#FF6B35' },
              { age: '19-35', percentage: 35, color: '#FF8C5A' },
              { age: '36-55', percentage: 28, color: '#FFB399' },
              { age: '56+', percentage: 15, color: '#FFD6CC' }
            ],
            incomeDistribution: [
              { range: '₦0-1M', percentage: 15 },
              { range: '₦1M-3M', percentage: 25 },
              { range: '₦3M-5M', percentage: 30 },
              { range: '₦5M+', percentage: 30 }
            ]
          }
        };

        setAnalytics(transformedAnalytics);
      } else {
        // Fallback to mock data if no neighborhood data found
        const mockAnalytics = {
          overview: {
            name: 'Victoria Island',
            city: 'Lagos',
            state: 'Lagos State',
            population: 125000,
            medianAge: 32,
            averageIncome: 4500000,
            crimeRate: 'Low',
            crimeScore: 85,
            schoolRating: 4.2,
            walkScore: 78,
            transitScore: 65,
            bikeScore: 45,
            propertyValue: 8500000,
            priceGrowth: 12.5,
            rentalYield: 6.8
          },
          safety: {
            overall: 85,
            violentCrime: 15,
            propertyCrime: 25,
            trafficIncidents: 45,
            emergencyResponse: 8.5,
            policeStations: 3,
            hospitals: 2,
            fireStations: 1,
            trends: [
              { month: 'Jan', rate: 22 },
              { month: 'Feb', rate: 20 },
              { month: 'Mar', rate: 18 },
              { month: 'Apr', rate: 16 },
              { month: 'May', rate: 15 },
              { month: 'Jun', rate: 14 }
            ]
          },
          education: {
            averageRating: 4.2,
            totalSchools: 12,
            elementary: 4,
            middle: 3,
            high: 3,
            universities: 2,
            topSchools: [
              { name: 'Victoria Island International School', rating: 4.8, type: 'Private' },
              { name: 'Lagos State Model College', rating: 4.5, type: 'Public' },
              { name: 'British International School', rating: 4.7, type: 'Private' }
            ]
          },
          amenities: {
            restaurants: 45,
            cafes: 23,
            shopping: 67,
            parks: 8,
            gyms: 12,
            entertainment: 15,
            walkability: 78,
            nearbyAmenities: [
              { name: 'Victoria Island Mall', type: 'Shopping', distance: '0.5 km' },
              { name: 'Lagos Yacht Club', type: 'Entertainment', distance: '1.2 km' },
              { name: 'Victoria Island Park', type: 'Recreation', distance: '0.8 km' }
            ]
          },
          market: {
            medianPrice: 8500000,
            pricePerSqft: 8500,
            daysOnMarket: 45,
            inventory: 234,
            priceGrowth: 12.5,
            rentalRates: {
              studio: 1200000,
              oneBed: 1800000,
              twoBed: 2500000,
              threeBed: 3500000
            }
          },
          demographics: {
            ageDistribution: [
              { age: '0-18', percentage: 22, color: '#FF6B35' },
              { age: '19-35', percentage: 35, color: '#FF8C5A' },
              { age: '36-55', percentage: 28, color: '#FFB399' },
              { age: '56+', percentage: 15, color: '#FFD6CC' }
            ],
            incomeDistribution: [
              { range: '₦0-1M', percentage: 15 },
              { range: '₦1M-3M', percentage: 25 },
              { range: '₦3M-5M', percentage: 30 },
              { range: '₦5M+', percentage: 30 }
            ]
          }
        };

        setAnalytics(mockAnalytics);
      }
    } catch (error) {
      console.error('Error loading neighborhood data:', error);

      // Fallback to original mock data
      const mockAnalytics = {
        overview: {
          name: 'Victoria Island',
          city: 'Lagos',
          state: 'Lagos State',
          population: 125000,
          medianAge: 32,
          averageIncome: 4500000,
          crimeRate: 'Low',
          crimeScore: 85,
          schoolRating: 4.2,
          walkScore: 78,
          transitScore: 65,
          bikeScore: 45,
          propertyValue: 8500000,
          priceGrowth: 12.5,
          rentalYield: 6.8
        },
        safety: {
          overall: 85,
          violentCrime: 15,
          propertyCrime: 25,
          trafficIncidents: 45,
          emergencyResponse: 8.5,
          policeStations: 3,
          hospitals: 2,
          fireStations: 1,
          trends: [
            { month: 'Jan', rate: 22 },
            { month: 'Feb', rate: 20 },
            { month: 'Mar', rate: 18 },
            { month: 'Apr', rate: 16 },
            { month: 'May', rate: 15 },
            { month: 'Jun', rate: 14 }
          ]
        },
        education: {
          averageRating: 4.2,
          totalSchools: 12,
          elementary: 4,
          middle: 3,
          high: 3,
          universities: 2,
          topSchools: [
            { name: 'Victoria Island International School', rating: 4.8, type: 'Private' },
            { name: 'Lagos State Model College', rating: 4.5, type: 'Public' },
            { name: 'British International School', rating: 4.7, type: 'Private' }
          ]
        },
        amenities: {
          restaurants: 45,
          cafes: 23,
          shopping: 67,
          parks: 8,
          gyms: 12,
          entertainment: 15,
          walkability: 78,
          nearbyAmenities: [
            { name: 'Victoria Island Mall', type: 'Shopping', distance: '0.5 km' },
            { name: 'Lagos Yacht Club', type: 'Entertainment', distance: '1.2 km' },
            { name: 'Victoria Island Park', type: 'Recreation', distance: '0.8 km' }
          ]
        },
        market: {
          medianPrice: 8500000,
          pricePerSqft: 8500,
          daysOnMarket: 45,
          inventory: 234,
          priceGrowth: 12.5,
          rentalRates: {
            studio: 1200000,
            oneBed: 1800000,
            twoBed: 2500000,
            threeBed: 3500000
          }
        },
        demographics: {
          ageDistribution: [
            { age: '0-18', percentage: 22, color: '#FF6B35' },
            { age: '19-35', percentage: 35, color: '#FF8C5A' },
            { age: '36-55', percentage: 28, color: '#FFB399' },
            { age: '56+', percentage: 15, color: '#FFD6CC' }
          ],
          incomeDistribution: [
            { range: '₦0-1M', percentage: 15 },
            { range: '₦1M-3M', percentage: 25 },
            { range: '₦3M-5M', percentage: 30 },
            { range: '₦5M+', percentage: 30 }
          ]
        }
      };

      setAnalytics(mockAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSafetyLabel = (score) => {
    if (score >= 80) return 'Very Safe';
    if (score >= 60) return 'Moderately Safe';
    return 'Use Caution';
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Neighborhood Analytics</h1>
                <p className="text-gray-600">{location} - Comprehensive area analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Safety Score</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.crimeScore}/100</p>
                <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getSafetyColor(analytics.overview.crimeScore)}`}>
                  {getSafetyLabel(analytics.overview.crimeScore)}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
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
                <p className="text-sm font-medium text-gray-600">School Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.schoolRating}/5</p>
                <p className="text-xs text-gray-500 mt-1">{analytics.overview.totalSchools} schools</p>
              </div>
              <School className="w-8 h-8 text-blue-500" />
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
                <p className="text-sm font-medium text-gray-600">Walk Score</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.walkScore}/100</p>
                <p className="text-xs text-gray-500 mt-1">Walkable neighborhood</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
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
                <p className="text-sm font-medium text-gray-600">Median Price</p>
                <p className="text-2xl font-bold text-gray-900">₦{analytics.overview.propertyValue.toLocaleString()}</p>
                <p className={`text-xs flex items-center mt-1 ${
                  analytics.overview.priceGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.overview.priceGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(analytics.overview.priceGrowth)}% growth
                </p>
              </div>
              <Home className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Info },
                { id: 'safety', label: 'Safety & Crime', icon: Shield },
                { id: 'education', label: 'Education', icon: School },
                { id: 'amenities', label: 'Amenities', icon: ShoppingCart },
                { id: 'market', label: 'Market Data', icon: DollarSign },
                { id: 'demographics', label: 'Demographics', icon: Users }
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

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Area Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Population:</span>
                    <span className="font-medium">{analytics.overview.population.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Median Age:</span>
                    <span className="font-medium">{analytics.overview.medianAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Income:</span>
                    <span className="font-medium">₦{analytics.overview.averageIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Walk Score:</span>
                    <span className="font-medium">{analytics.overview.walkScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transit Score:</span>
                    <span className="font-medium">{analytics.overview.transitScore}/100</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Potential</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rental Yield:</span>
                    <span className="font-medium text-green-600">{analytics.overview.rentalYield}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Growth:</span>
                    <span className="font-medium text-green-600">+{analytics.overview.priceGrowth}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days on Market:</span>
                    <span className="font-medium">{analytics.overview.daysOnMarket} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Properties:</span>
                    <span className="font-medium">{analytics.overview.inventory}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Safety Tab */}
          {activeTab === 'safety' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Crime Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Overall Safety Score:</span>
                    <span className={`font-bold ${getSafetyColor(analytics.safety.overall)}`}>
                      {analytics.safety.overall}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Violent Crime Rate:</span>
                    <span className="font-medium text-red-600">{analytics.safety.violentCrime}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Crime Rate:</span>
                    <span className="font-medium text-yellow-600">{analytics.safety.propertyCrime}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Emergency Response:</span>
                    <span className="font-medium text-green-600">{analytics.safety.emergencyResponse} min</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Trend</h3>
                <div className="h-48 flex items-end justify-between space-x-2">
                  {analytics.safety.trends.map((data, index) => (
                    <div key={data.month} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-green-500 rounded-t"
                        style={{ height: `${(data.rate / 25) * 100}%` }}
                      />
                      <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Education Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {analytics.overview.schoolRating}
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {analytics.overview.totalSchools}
                    </div>
                    <div className="text-sm text-gray-600">Total Schools</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {analytics.overview.universities}
                    </div>
                    <div className="text-sm text-gray-600">Universities</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Schools</h3>
                <div className="space-y-4">
                  {analytics.education.topSchools.map((school, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{school.name}</h4>
                          <p className="text-sm text-gray-600">{school.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= school.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{school.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities Count</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <ShoppingCart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{analytics.amenities.shopping}</div>
                    <div className="text-sm text-gray-600">Shopping Centers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Utensils className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{analytics.amenities.restaurants}</div>
                    <div className="text-sm text-gray-600">Restaurants</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <TreePine className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{analytics.amenities.parks}</div>
                    <div className="text-sm text-gray-600">Parks</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{analytics.amenities.gyms}</div>
                    <div className="text-sm text-gray-600">Gyms</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Amenities</h3>
                <div className="space-y-3">
                  {analytics.amenities.nearbyAmenities.map((amenity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{amenity.name}</p>
                          <p className="text-sm text-gray-600">{amenity.type}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{amenity.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Market Data Tab */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Median Property Price:</span>
                      <span className="font-medium">₦{analytics.market.medianPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per Sq Ft:</span>
                      <span className="font-medium">₦{analytics.market.pricePerSqft.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days on Market:</span>
                      <span className="font-medium">{analytics.market.daysOnMarket} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Listings:</span>
                      <span className="font-medium">{analytics.market.inventory}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Rates</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.market.rentalRates).map(([type, rate]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {type.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                        </span>
                        <span className="font-medium">₦{rate.toLocaleString()}/month</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demographics Tab */}
          {activeTab === 'demographics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
                <div className="space-y-3">
                  {analytics.demographics.ageDistribution.map((group) => (
                    <div key={group.age} className="flex items-center justify-between">
                      <span className="text-gray-600">{group.age}:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${group.percentage}%`,
                              backgroundColor: group.color
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Distribution</h3>
                <div className="space-y-3">
                  {analytics.demographics.incomeDistribution.map((group) => (
                    <div key={group.range} className="flex items-center justify-between">
                      <span className="text-gray-600">{group.range}:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Neighborhood Summary */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Neighborhood Summary</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>• {analytics.overview.name} is a highly desirable area with excellent safety ratings</p>
                <p>• Strong school system with multiple top-rated educational institutions</p>
                <p>• Excellent walkability and access to amenities make it ideal for families</p>
                <p>• Property values have shown consistent growth with good rental yields</p>
                <p>• Diverse population with strong economic indicators</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NeighborhoodAnalytics;
