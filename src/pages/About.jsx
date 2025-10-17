import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Zap, Shield, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Search',
      description: 'Our advanced AI understands your preferences and finds the perfect properties for you.'
    },
    {
      icon: Home,
      title: 'Verified Properties',
      description: 'All properties are verified and cross-checked to ensure authenticity and accuracy.'
    },
    {
      icon: Users,
      title: 'Expert Agents',
      description: 'Connect with professional real estate agents who understand your needs.'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data and transactions are protected with industry-leading security measures.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Properties Listed' },
    { number: '5,000+', label: 'Happy Customers' },
    { number: '500+', label: 'Verified Agents' },
    { number: '24/7', label: 'Customer Support' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About HomeSwift
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Revolutionizing the real estate industry with AI-powered property search and seamless user experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#FF6B35] to-[#e85e2f] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Making Real Estate Simple, Fast, and Smart
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
                HomeSwift combines cutting-edge artificial intelligence with deep real estate expertise to help you find your perfect home or investment property.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="bg-white text-[#FF6B35] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Today
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-[#FF6B35] mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose HomeSwift?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're not just another real estate platform. We're your intelligent partner in finding the perfect property.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center"
              >
                <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              To democratize access to quality real estate information and make property search as simple as having a conversation.
              We believe that finding your dream home shouldn't be complicated, time-consuming, or frustrating.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Innovation',
                description: 'We continuously push the boundaries of what\'s possible in real estate technology.'
              },
              {
                title: 'Transparency',
                description: 'We believe in complete honesty and clarity in all our interactions and processes.'
              },
              {
                title: 'Customer-Centric',
                description: 'Every decision we make is guided by what\'s best for our users and their needs.'
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#FF6B35] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Find Your Perfect Home?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of satisfied customers who found their dream properties with HomeSwift.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="bg-white text-[#FF6B35] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-[#FF6B35] transition-colors"
              >
                Try AI Search
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
