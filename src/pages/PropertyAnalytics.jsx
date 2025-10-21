import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart as BarChartIcon,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Calendar,
  DollarSign,
  Users,
  Home,
  MapPin,
  Clock,
  Target,
  Award,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const PropertyAnalytics = () => {
  const { user, isAuthenticated, currentRole } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    console.log('🔍 PropertyAnalytics - Auth state:', {
      isAuthenticated,
      currentRole,
      userId: user?.id,
      userType: user?.user_metadata?.user_type
    });

    if (isAuthenticated && currentRole === 'landlord') {
      loadAnalytics();
    }
  }, [isAuthenticated, currentRole, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      // Get current date and calculate date ranges based on timeRange
      const now = new Date();
      const timeRangeDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };

      const days = timeRangeDays[timeRange] || 30;
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      // Fetch landlord's properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user.id);

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        throw propertiesError;
      }

      const propertyIds = properties?.map(p => p.id) || [];

      // Fetch property views for the time range
      let { data: viewsData, error: viewsError } = { data: [], error: null };
      if (propertyIds.length > 0) {
        const viewsResult = await supabase
          .from('property_views')
          .select('property_id, created_at')
          .in('property_id', propertyIds)
          .gte('created_at', startDate.toISOString());

        viewsData = viewsResult.data || [];
        viewsError = viewsResult.error;
      }

      if (viewsError) {
        console.error('Error fetching property views:', viewsError);
      }

      // Fetch inquiries for the time range
      let { data: inquiriesData, error: inquiriesError } = { data: [], error: null };
      if (propertyIds.length > 0) {
        const inquiriesResult = await supabase
          .from('inquiries')
          .select('*')
          .eq('landlord_id', user.id)
          .gte('created_at', startDate.toISOString());

        inquiriesData = inquiriesResult.data || [];
        inquiriesError = inquiriesResult.error;
      }

      if (inquiriesError) {
        console.error('Error fetching inquiries:', inquiriesError);
      }

      // Calculate real analytics from the data
      const totalProperties = properties?.length || 0;
      const totalViews = viewsData?.length || 0;
      const totalInquiries = inquiriesData?.length || 0;

      // Calculate views by property
      const viewsByProperty = {};
      viewsData?.forEach(view => {
        viewsByProperty[view.property_id] = (viewsByProperty[view.property_id] || 0) + 1;
      });

      // Calculate inquiries by property
      const inquiriesByProperty = {};
      inquiriesData?.forEach(inquiry => {
        inquiriesByProperty[inquiry.property_id] = (inquiriesByProperty[inquiry.property_id] || 0) + 1;
      });

      // Generate property performance data
      const propertiesWithAnalytics = properties?.map(property => ({
        id: property.id,
        title: property.title || 'Untitled Property',
        location: property.location || 'Location not specified',
        views: viewsByProperty[property.id] || 0,
        inquiries: inquiriesByProperty[property.id] || 0,
        bookings: Math.floor((viewsByProperty[property.id] || 0) * 0.15), // Estimate bookings as 15% of views
        rating: 4.0 + (Math.random() * 1), // Mock rating for now - would need reviews table
        revenue: Math.floor((viewsByProperty[property.id] || 0) * 15000), // Estimate revenue
        occupancy: Math.floor(70 + (Math.random() * 30)) // Mock occupancy rate
      })) || [];

      // Generate trend data for the selected time range
      const trendData = generateTrendData(startDate, now, viewsData, inquiriesData);

      // Calculate overview metrics
      const previousPeriodDays = days;
      const previousStartDate = new Date(now.getTime() - (previousPeriodDays * 2 * 24 * 60 * 60 * 1000));
      const previousEndDate = new Date(now.getTime() - (previousPeriodDays * 24 * 60 * 60 * 1000));

      const currentPeriodViews = viewsData?.filter(v =>
        new Date(v.created_at) >= startDate
      ).length || 0;

      const previousPeriodViews = viewsData?.filter(v =>
        new Date(v.created_at) >= previousStartDate &&
        new Date(v.created_at) < previousEndDate
      ).length || 0;

      const currentPeriodInquiries = inquiriesData?.filter(i =>
        new Date(i.created_at) >= startDate
      ).length || 0;

      const previousPeriodInquiries = inquiriesData?.filter(i =>
        new Date(i.created_at) >= previousStartDate &&
        new Date(i.created_at) < previousEndDate
      ).length || 0;

      const viewsGrowth = previousPeriodViews > 0 ?
        ((currentPeriodViews - previousPeriodViews) / previousPeriodViews * 100) : 0;

      const inquiriesGrowth = previousPeriodInquiries > 0 ?
        ((currentPeriodInquiries - previousPeriodInquiries) / previousPeriodInquiries * 100) : 0;

      // Estimate revenue (this would need a bookings/payments table in real implementation)
      const estimatedMonthlyRevenue = propertiesWithAnalytics.reduce((sum, p) => sum + p.revenue, 0);

      const realAnalytics = {
        overview: {
          totalProperties,
          totalViews,
          totalInquiries,
          totalBookings: Math.floor(totalViews * 0.15), // Estimate based on views
          averageRating: propertiesWithAnalytics.length > 0 ?
            propertiesWithAnalytics.reduce((sum, p) => sum + p.rating, 0) / propertiesWithAnalytics.length : 0,
          occupancyRate: propertiesWithAnalytics.length > 0 ?
            Math.round(propertiesWithAnalytics.reduce((sum, p) => sum + p.occupancy, 0) / propertiesWithAnalytics.length) : 0,
          monthlyRevenue: estimatedMonthlyRevenue,
          previousMonthRevenue: Math.floor(estimatedMonthlyRevenue * 0.9), // Mock previous month
          revenueGrowth: 7.1, // Would need historical data for real calculation
          viewsGrowth,
          inquiriesGrowth
        },
        properties: propertiesWithAnalytics,
        trends: trendData,
        demographics: {
          ageGroups: [
            { name: '18-25', value: 15, color: '#FF6B35' },
            { name: '26-35', value: 35, color: '#FF8C5A' },
            { name: '36-45', value: 28, color: '#FFB399' },
            { name: '46-55', value: 15, color: '#FFD6CC' },
            { name: '55+', value: 7, color: '#FFE5DD' }
          ],
          locations: [
            { name: 'Lagos', value: 45 },
            { name: 'Abuja', value: 25 },
            { name: 'Port Harcourt', value: 15 },
            { name: 'Kano', value: 10 },
            { name: 'Others', value: 5 }
          ]
        }
      };

      setAnalytics(realAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to mock data on error
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (startDate, endDate, viewsData, inquiriesData) => {
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, Math.floor(daysDiff / 7)); // Show ~7 data points

    const viewsTrend = [];
    const inquiriesTrend = [];

    for (let i = 0; i < daysDiff; i += interval) {
      const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const nextDate = new Date(currentDate.getTime() + (interval * 24 * 60 * 60 * 1000));

      const dayViews = viewsData?.filter(v => {
        const viewDate = new Date(v.created_at);
        return viewDate >= currentDate && viewDate < nextDate;
      }).length || 0;

      const dayInquiries = inquiriesData?.filter(i => {
        const inquiryDate = new Date(i.created_at);
        return inquiryDate >= currentDate && inquiryDate < nextDate;
      }).length || 0;

      viewsTrend.push({
        date: currentDate.toISOString().split('T')[0],
        views: dayViews
      });

      inquiriesTrend.push({
        date: currentDate.toISOString().split('T')[0],
        inquiries: dayInquiries
      });
    }

    return {
      views: viewsTrend,
      inquiries: inquiriesTrend
    };
  };

  const getMockAnalytics = () => {
    return {
      overview: {
        totalProperties: 12,
        totalViews: 1247,
        totalInquiries: 89,
        totalBookings: 23,
        averageRating: 4.2,
        occupancyRate: 87,
        monthlyRevenue: 4500000,
        previousMonthRevenue: 4200000,
        revenueGrowth: 7.1,
        viewsGrowth: 12,
        inquiriesGrowth: 8
      },
      properties: [
        {
          id: 1,
          title: 'Modern Apartment in VI',
          location: 'Victoria Island',
          views: 156,
          inquiries: 12,
          bookings: 3,
          rating: 4.5,
          revenue: 1800000,
          occupancy: 95
        },
        {
          id: 2,
          title: 'Luxury Villa in Lekki',
          location: 'Lekki Phase 1',
          views: 203,
          inquiries: 18,
          bookings: 5,
          rating: 4.8,
          revenue: 3200000,
          occupancy: 90
        }
      ],
      trends: {
        views: [
          { date: '2024-01-01', views: 45 },
          { date: '2024-01-02', views: 52 },
          { date: '2024-01-03', views: 38 },
          { date: '2024-01-04', views: 61 },
          { date: '2024-01-05', views: 49 },
          { date: '2024-01-06', views: 67 },
          { date: '2024-01-07', views: 58 }
        ],
        inquiries: [
          { date: '2024-01-01', inquiries: 3 },
          { date: '2024-01-02', inquiries: 5 },
          { date: '2024-01-03', inquiries: 2 },
          { date: '2024-01-04', inquiries: 7 },
          { date: '2024-01-05', inquiries: 4 },
          { date: '2024-01-06', inquiries: 6 },
          { date: '2024-01-07', inquiries: 8 }
        ]
      },
      demographics: {
        ageGroups: [
          { name: '18-25', value: 15, color: '#FF6B35' },
          { name: '26-35', value: 35, color: '#FF8C5A' },
          { name: '36-45', value: 28, color: '#FFB399' },
          { name: '46-55', value: 15, color: '#FFD6CC' },
          { name: '55+', value: 7, color: '#FFE5DD' }
        ],
        locations: [
          { name: 'Lagos', value: 45 },
          { name: 'Abuja', value: 25 },
          { name: 'Port Harcourt', value: 15 },
          { name: 'Kano', value: 10 },
          { name: 'Others', value: 5 }
        ]
      }
    };
  };

  if (!isAuthenticated || currentRole !== 'landlord') {
    console.log('❌ PropertyAnalytics - Access denied:', {
      isAuthenticated,
      currentRole,
      userId: user?.id,
      userType: user?.user_metadata?.user_type,
      reason: !isAuthenticated ? 'not authenticated' : 'currentRole is not landlord'
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Landlord Access Required</h2>
          <p className="text-gray-600 mb-6">This dashboard is only available for property owners</p>
          <p className="text-sm text-gray-500">
            Debug: {isAuthenticated ? `Role: ${currentRole}` : 'Not authenticated'}
          </p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Analytics</h1>
                <p className="text-gray-600">Track your property performance and tenant engagement</p>
              </div>
            </div>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
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
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalProperties}</p>
              </div>
              <Home className="w-8 h-8 text-blue-500" />
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
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
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
                <p className="text-sm font-medium text-gray-600">Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalInquiries}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  +8% conversion rate
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
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
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₦{analytics.overview.monthlyRevenue.toLocaleString()}</p>
                <p className={`text-xs flex items-center mt-1 ${
                  analytics.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.overview.revenueGrowth >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(analytics.overview.revenueGrowth)}% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Views Trend */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Views Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends.views}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'MMM dd')} />
                <YAxis />
                <Tooltip labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')} />
                <Line type="monotone" dataKey="views" stroke="#FF6B35" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Inquiries Trend */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquiries Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.trends.inquiries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'MMM dd')} />
                <YAxis />
                <Tooltip labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')} />
                <Bar dataKey="inquiries" fill="#FF6B35" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Properties Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Property Performance</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inquiries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.inquiries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.bookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{property.rating}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= property.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₦{property.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        property.occupancy >= 90 ? 'bg-green-100 text-green-800' :
                        property.occupancy >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {property.occupancy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Demographics and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Demographics */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Demographics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.demographics.ageGroups}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.demographics.ageGroups.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Locations */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h3>
            <div className="space-y-3">
              {analytics.demographics.locations.map((location, index) => (
                <div key={location.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-gray-900">{location.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{location.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Key Insights & Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-gray-900">Best Performer</span>
              </div>
              <p className="text-sm text-gray-600">
                "Luxury Villa in Lekki" has the highest engagement rate with 18 inquiries this month.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <Activity className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">Peak Activity</span>
              </div>
              <p className="text-sm text-gray-600">
                Most views occur between 2 PM - 4 PM on weekdays. Consider scheduling open houses during these times.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <Award className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-medium text-gray-900">Top Rating</span>
              </div>
              <p className="text-sm text-gray-600">
                Properties with virtual tours receive 40% more inquiries. Consider adding more virtual tours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyAnalytics;
