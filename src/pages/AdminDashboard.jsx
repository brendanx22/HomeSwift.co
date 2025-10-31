import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Eye, 
  Home, 
  TrendingUp,
  Calendar,
  Activity,
  MapPin,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react';
import posthog from '../lib/posthog';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalListings: 0,
    totalPageViews: 0,
    activeUsers: 0,
    conversionRate: 0
  });

  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you would fetch this data from PostHog API
    // For now, we'll use mock data
    const fetchAnalytics = async () => {
      try {
        // Mock data - replace with actual PostHog API calls
        setStats({
          totalUsers: 1247,
          totalMessages: 8934,
          totalListings: 342,
          totalPageViews: 45678,
          activeUsers: 89,
          conversionRate: 12.5
        });

        setRecentEvents([
          { id: 1, event: 'listing_viewed', user: 'user_123', timestamp: new Date(), data: { listing_id: 'prop_456' } },
          { id: 2, event: 'message_sent', user: 'user_789', timestamp: new Date(), data: { conversation_id: 'conv_012' } },
          { id: 3, event: 'user_signup', user: 'user_345', timestamp: new Date(), data: { method: 'google' } },
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12.5%'
    },
    {
      title: 'Messages Sent',
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      change: '+8.3%'
    },
    {
      title: 'Listings Viewed',
      value: stats.totalListings.toLocaleString(),
      icon: Eye,
      color: 'from-purple-500 to-purple-600',
      change: '+15.7%'
    },
    {
      title: 'Page Views',
      value: stats.totalPageViews.toLocaleString(),
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      change: '+22.1%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      color: 'from-pink-500 to-pink-600',
      change: '+5.2%'
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600',
      change: '+3.1%'
    }
  ];

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'listing_viewed':
        return <Home className="w-4 h-4" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4" />;
      case 'user_signup':
        return <Users className="w-4 h-4" />;
      case 'search_performed':
        return <MapPin className="w-4 h-4" />;
      case 'application_submitted':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'listing_viewed':
        return 'bg-blue-100 text-blue-600';
      case 'message_sent':
        return 'bg-green-100 text-green-600';
      case 'user_signup':
        return 'bg-purple-100 text-purple-600';
      case 'search_performed':
        return 'bg-orange-100 text-orange-600';
      case 'application_submitted':
        return 'bg-pink-100 text-pink-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your application's performance and user activity
          </p>
        </motion.div>

        {/* PostHog Integration Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                PostHog Integration Active
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                View detailed analytics and session recordings in your PostHog dashboard
              </p>
              <a
                href="https://app.posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Open PostHog Dashboard →
              </a>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Events
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time activity from your users
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentEvents.map((event) => (
              <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg ${getEventColor(event.event)} mr-4`}>
                    {getEventIcon(event.event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      User: {event.user}
                    </p>
                    {event.data && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {JSON.stringify(event.data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <a
            href="https://app.posthog.com/insights"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <BarChart3 className="w-8 h-8 text-[#FF6B35] mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              View Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Explore detailed analytics and trends
            </p>
          </a>

          <a
            href="https://app.posthog.com/recordings"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Eye className="w-8 h-8 text-[#FF6B35] mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Session Recordings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Watch user sessions and interactions
            </p>
          </a>

          <a
            href="https://app.posthog.com/events"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <Activity className="w-8 h-8 text-[#FF6B35] mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Event Explorer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse and analyze all tracked events
            </p>
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
