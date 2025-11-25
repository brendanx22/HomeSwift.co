import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    HelpCircle,
    Search,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    Mail,
    Phone,
    Book,
    Home,
    User,
    CreditCard,
    Shield,
    Settings
} from 'lucide-react';

const Help = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const categories = [
        { id: 'all', name: 'All Topics', icon: Book },
        { id: 'getting-started', name: 'Getting Started', icon: Home },
        { id: 'account', name: 'Account & Profile', icon: User },
        { id: 'properties', name: 'Properties', icon: Home },
        { id: 'payments', name: 'Payments & Billing', icon: CreditCard },
        { id: 'security', name: 'Security & Privacy', icon: Shield },
        { id: 'technical', name: 'Technical Issues', icon: Settings },
    ];

    const faqs = [
        {
            category: 'getting-started',
            question: 'How do I create an account?',
            answer: 'Click the "Sign Up" button in the top right corner. You can sign up using your email or Google account. Choose whether you\'re a renter or landlord, fill in your details, and verify your email address.'
        },
        {
            category: 'getting-started',
            question: 'What\'s the difference between renter and landlord accounts?',
            answer: 'Renter accounts can search for properties, save favorites, and contact landlords. Landlord accounts can list properties, manage inquiries, and communicate with potential renters. You can switch between roles if needed.'
        },
        {
            category: 'account',
            question: 'How do I update my profile information?',
            answer: 'Go to Settings from your dashboard, then click on "Profile". You can update your name, email, phone number, profile picture, and other details. Don\'t forget to save your changes!'
        },
        {
            category: 'account',
            question: 'How do I change my password?',
            answer: 'Navigate to Settings > Security. Click "Change Password", enter your current password, then your new password twice. Make sure your new password is strong and unique.'
        },
        {
            category: 'account',
            question: 'Can I delete my account?',
            answer: 'Yes, go to Settings > Account > Delete Account. Note that this action is permanent and will remove all your data, including saved properties and messages. You\'ll need to confirm the deletion.'
        },
        {
            category: 'properties',
            question: 'How do I search for properties?',
            answer: 'Use the search bar on the homepage or browse page. You can filter by location, price range, number of bedrooms, amenities, and more. Save your favorite properties to view them later.'
        },
        {
            category: 'properties',
            question: 'How do I list a property as a landlord?',
            answer: 'Click "List Property" from your landlord dashboard. Fill in all required details including address, price, description, and upload high-quality photos. Review and publish your listing.'
        },
        {
            category: 'properties',
            question: 'How do I edit or remove my property listing?',
            answer: 'Go to "My Properties" in your landlord dashboard. Click on the property you want to edit, make your changes, and save. To remove a listing, click the delete button and confirm.'
        },
        {
            category: 'properties',
            question: 'How do I contact a landlord about a property?',
            answer: 'Click on any property listing, then click "Contact Landlord" or "Send Message". You can also schedule a viewing or make an inquiry directly from the property page.'
        },
        {
            category: 'payments',
            question: 'Is HomeSwift free to use?',
            answer: 'For renters, HomeSwift is completely free. Landlords can list properties for free, with optional premium features available for enhanced visibility and additional tools.'
        },
        {
            category: 'payments',
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets. All payments are processed securely through our payment provider.'
        },
        {
            category: 'security',
            question: 'Is my personal information safe?',
            answer: 'Yes! We use industry-standard encryption to protect your data. We never share your personal information with third parties without your consent. Read our Privacy Policy for more details.'
        },
        {
            category: 'security',
            question: 'How do I report a suspicious listing or user?',
            answer: 'Click the "Report" button on any listing or user profile. Provide details about your concern, and our team will investigate promptly. We take safety seriously and will take appropriate action.'
        },
        {
            category: 'security',
            question: 'What should I do if I forgot my password?',
            answer: 'Click "Forgot Password" on the login page. Enter your email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.'
        },
        {
            category: 'technical',
            question: 'The website is loading slowly. What should I do?',
            answer: 'Try clearing your browser cache and cookies. Make sure you have a stable internet connection. If the problem persists, try using a different browser or contact our support team.'
        },
        {
            category: 'technical',
            question: 'I\'m not receiving email notifications. Why?',
            answer: 'Check your spam/junk folder. Add noreply@homeswift.co to your contacts. Verify your email settings in your account preferences. If issues persist, contact support.'
        },
        {
            category: 'technical',
            question: 'Can I use HomeSwift on my mobile device?',
            answer: 'Yes! HomeSwift is fully responsive and works great on all devices. You can also install our Progressive Web App (PWA) for a native app-like experience on mobile.'
        },
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const matchesSearch = searchQuery === '' ||
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-[#FF6B35] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Title Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#FF6B35] to-orange-500 rounded-2xl mb-6">
                        <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">How Can We Help?</h1>
                    <p className="text-gray-600 text-lg">Find answers to common questions or contact our support team</p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-2xl mx-auto mb-12"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all text-lg"
                        />
                    </div>
                </motion.div>

                {/* Categories */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="flex flex-wrap gap-3 justify-center">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === category.id
                                            ? 'bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white shadow-lg'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{category.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* FAQs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-4xl mx-auto mb-12"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {selectedCategory === 'all' ? 'Frequently Asked Questions' : `${categories.find(c => c.id === selectedCategory)?.name} FAQs`}
                    </h2>

                    {filteredFaqs.length > 0 ? (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {filteredFaqs.map((faq, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                                            {expandedFaq === index ? (
                                                <ChevronUp className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {expandedFaq === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-4 text-gray-700 leading-relaxed">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No results found. Try a different search term or category.</p>
                        </div>
                    )}
                </motion.div>

                {/* Contact Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-[#FF6B35] to-orange-500 rounded-2xl p-8 text-white"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2">Still Need Help?</h2>
                        <p className="text-white/90">Our support team is here to assist you</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Live Chat */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold mb-2">Live Chat</h3>
                            <p className="text-white/80 text-sm mb-4">Chat with our support team</p>
                            <button className="bg-white text-[#FF6B35] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                                Start Chat
                            </button>
                        </div>

                        {/* Email */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold mb-2">Email Support</h3>
                            <p className="text-white/80 text-sm mb-4">We'll respond within 24 hours</p>
                            <a
                                href="mailto:support@homeswift.co"
                                className="inline-block bg-white text-[#FF6B35] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                            >
                                Send Email
                            </a>
                        </div>

                        {/* Phone */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold mb-2">Phone Support</h3>
                            <p className="text-white/80 text-sm mb-4">Mon-Fri, 9AM-6PM EST</p>
                            <a
                                href="tel:+1234567890"
                                className="inline-block bg-white text-[#FF6B35] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                            >
                                Call Us
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center space-x-6"
                >
                    <Link to="/terms" className="text-[#FF6B35] hover:underline">
                        Terms of Service
                    </Link>
                    <Link to="/privacy" className="text-[#FF6B35] hover:underline">
                        Privacy Policy
                    </Link>
                    <Link to="/contact" className="text-[#FF6B35] hover:underline">
                        Contact Us
                    </Link>
                    <Link to="/faq" className="text-[#FF6B35] hover:underline">
                        More FAQs
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default Help;
