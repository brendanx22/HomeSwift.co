import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, Search, MessageCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FAQ() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = React.useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqData = [
    {
      id: 'getting-started',
      question: 'How do I get started with HomeSwift?',
      answer: 'Getting started is easy! Simply sign up for an account, complete your profile, and start browsing properties or listing your own. Our AI-powered search will help you find exactly what you\'re looking for.'
    },
    {
      id: 'account-types',
      question: 'What\'s the difference between renter and landlord accounts?',
      answer: 'Renter accounts are for people looking for properties to rent, while landlord accounts are for property owners and agents who want to list properties. Each account type has tailored features for their specific needs.'
    },
    {
      id: 'listing-property',
      question: 'How do I list my property?',
      answer: 'To list a property, you need a landlord account. Click "Add Property" from your dashboard, fill in the property details, upload images, and publish your listing. Our team will review it before it goes live.'
    },
    {
      id: 'property-search',
      question: 'How does the AI-powered search work?',
      answer: 'Our AI analyzes your search criteria, preferences, and behavior patterns to recommend the most relevant properties. It considers factors like location, price range, amenities, and your past interactions.'
    },
    {
      id: 'contacting-agents',
      question: 'How do I contact a property agent?',
      answer: 'You can contact agents directly through the property listing page using the "Call Agent" or "Send Message" buttons. All communications are secure and tracked for your safety.'
    },
    {
      id: 'payment-security',
      question: 'Is my payment information secure?',
      answer: 'Absolutely. We use industry-standard encryption and never store your payment information. All transactions are processed through secure payment gateways with PCI compliance.'
    },
    {
      id: 'mobile-app',
      question: 'Do you have a mobile app?',
      answer: 'Currently, HomeSwift is available as a responsive web application that works perfectly on all devices. We\'re working on native mobile apps for iOS and Android.'
    },
    {
      id: 'support-hours',
      question: 'What are your customer support hours?',
      answer: 'Our customer support team is available 24/7 through our live chat system. For phone support, we\'re available Monday through Friday, 8:00 AM to 6:00 PM WAT.'
    }
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
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about HomeSwift and our services.
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#e85e2f] py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-white/90 mb-8">
              Our support team is here to help with any questions you might have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="bg-white text-[#FF6B35] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Support
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#FF6B35] transition-colors flex items-center justify-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Try AI Search
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-8">
            <div className="flex items-center mb-8">
              <HelpCircle className="w-8 h-8 text-[#FF6B35] mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Common Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    {openItems[faq.id] ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {openItems[faq.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Still Need Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-4">
            Still need help?
          </h3>
          <p className="mb-8 opacity-90 max-w-2xl mx-auto">
            Our support team is available 24/7 to answer your questions and help you get the most out of HomeSwift.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              Contact Support
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Live Chat
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
