import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Cookie, UserCheck, Globe, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
    const lastUpdated = "November 26, 2025";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-[#FF6B35] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Title Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#FF6B35] to-orange-500 rounded-2xl mb-6">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                    <p className="text-gray-600">Last updated: {lastUpdated}</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-8 space-y-8"
                >
                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                        <p className="text-gray-700 leading-relaxed">
                            At HomeSwift ("we," "our," or "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website and mobile applications (collectively, the "Service").
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Database className="w-6 h-6 text-[#FF6B35]" />
                            <span>2. Information We Collect</span>
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">2.1 Information You Provide</h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                    <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                                    <li><strong>Profile Information:</strong> Profile picture, bio, preferences</li>
                                    <li><strong>Property Listings:</strong> Property details, photos, descriptions (for landlords)</li>
                                    <li><strong>Communications:</strong> Messages sent through our platform</li>
                                    <li><strong>Payment Information:</strong> Billing details (processed securely by third-party providers)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">2.2 Information Collected Automatically</h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                    <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                                    <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the Service</li>
                                    <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                                    <li><strong>Cookies:</strong> See our Cookie Policy for details</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">2.3 Information from Third Parties</h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                    <li><strong>Social Media:</strong> If you sign in with Google or other providers</li>
                                    <li><strong>Analytics Providers:</strong> Usage statistics and behavior patterns</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Your Information */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Eye className="w-6 h-6 text-[#FF6B35]" />
                            <span>3. How We Use Your Information</span>
                        </h2>

                        <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Provide, maintain, and improve our Service</li>
                            <li>Create and manage your account</li>
                            <li>Process transactions and send related information</li>
                            <li>Send you technical notices, updates, and support messages</li>
                            <li>Respond to your comments, questions, and requests</li>
                            <li>Send you marketing communications (with your consent)</li>
                            <li>Monitor and analyze trends, usage, and activities</li>
                            <li>Detect, prevent, and address technical issues and fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    {/* Information Sharing */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Globe className="w-6 h-6 text-[#FF6B35]" />
                            <span>4. How We Share Your Information</span>
                        </h2>

                        <div className="space-y-4">
                            <p className="text-gray-700 leading-relaxed">We may share your information with:</p>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.1 Other Users</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    Your profile information and property listings (for landlords) are visible to other users of the Service.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.2 Service Providers</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    We work with third-party service providers for hosting, analytics, payment processing, and customer support.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.3 Legal Requirements</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    We may disclose your information if required by law or to protect our rights, property, or safety.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.4 Business Transfers</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    In connection with any merger, sale of company assets, or acquisition, your information may be transferred.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Data Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Lock className="w-6 h-6 text-[#FF6B35]" />
                            <span>5. Data Security</span>
                        </h2>

                        <p className="text-gray-700 leading-relaxed mb-4">
                            We implement appropriate technical and organizational measures to protect your personal information, including:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Encryption of data in transit and at rest</li>
                            <li>Regular security assessments and updates</li>
                            <li>Access controls and authentication</li>
                            <li>Secure data storage with Supabase</li>
                        </ul>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                            <p className="text-yellow-900 text-sm">
                                <strong>Note:</strong> No method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                            </p>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Cookie className="w-6 h-6 text-[#FF6B35]" />
                            <span>6. Cookies and Tracking</span>
                        </h2>

                        <p className="text-gray-700 leading-relaxed mb-4">
                            We use cookies and similar tracking technologies to:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Remember your preferences and settings</li>
                            <li>Understand how you use our Service</li>
                            <li>Improve our Service and user experience</li>
                            <li>Provide personalized content and recommendations</li>
                        </ul>

                        <p className="text-gray-700 leading-relaxed mt-4">
                            You can control cookies through your browser settings. See our <Link to="/cookies" className="text-[#FF6B35] hover:underline">Cookie Policy</Link> for more details.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <UserCheck className="w-6 h-6 text-[#FF6B35]" />
                            <span>7. Your Privacy Rights</span>
                        </h2>

                        <p className="text-gray-700 leading-relaxed mb-4">
                            Depending on your location, you may have the following rights:
                        </p>

                        <div className="space-y-3">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <h4 className="font-semibold text-blue-900 mb-2">Access & Portability</h4>
                                <p className="text-blue-800 text-sm">Request a copy of your personal information</p>
                            </div>

                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <h4 className="font-semibold text-green-900 mb-2">Correction</h4>
                                <p className="text-green-800 text-sm">Update or correct inaccurate information</p>
                            </div>

                            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                                <h4 className="font-semibold text-purple-900 mb-2">Deletion</h4>
                                <p className="text-purple-800 text-sm">Request deletion of your personal information</p>
                            </div>

                            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                                <h4 className="font-semibold text-orange-900 mb-2">Opt-Out</h4>
                                <p className="text-orange-800 text-sm">Unsubscribe from marketing communications</p>
                            </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed mt-4">
                            To exercise these rights, please contact us at <a href="mailto:privacy@homeswift.co" className="text-[#FF6B35] hover:underline">privacy@homeswift.co</a>
                        </p>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We retain your personal information for as long as necessary to provide our Service and comply with legal obligations. When you delete your account, we will delete or anonymize your information within 30 days, except where we are required to retain it by law.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Our Service is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                        </p>
                    </section>

                    {/* International Transfers */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                        </p>
                    </section>

                    {/* Changes to Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Mail className="w-6 h-6 text-[#FF6B35]" />
                            <span>12. Contact Us</span>
                        </h2>

                        <p className="text-gray-700 leading-relaxed mb-4">
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>

                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 space-y-3">
                            <div className="flex items-center space-x-3">
                                <Mail className="w-5 h-5 text-[#FF6B35]" />
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <a href="mailto:privacy@homeswift.co" className="text-gray-900 font-medium hover:text-[#FF6B35]">
                                        privacy@homeswift.co
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Globe className="w-5 h-5 text-[#FF6B35] mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="text-gray-900 font-medium">[Your Business Address]</p>
                                    <p className="text-gray-900">[City, State, ZIP]</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* GDPR/CCPA Notice */}
                    <section className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-3">For EU/EEA and California Residents</h3>
                        <p className="text-blue-800 text-sm leading-relaxed">
                            If you are located in the European Union, European Economic Area, or California, you have additional rights under GDPR and CCPA. Please contact us to exercise these rights or for more information about how we process your data.
                        </p>
                    </section>
                </motion.div>

                {/* Footer Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 text-center space-x-6"
                >
                    <Link to="/terms" className="text-[#FF6B35] hover:underline">
                        Terms of Service
                    </Link>
                    <Link to="/cookies" className="text-[#FF6B35] hover:underline">
                        Cookie Policy
                    </Link>
                    <Link to="/contact" className="text-[#FF6B35] hover:underline">
                        Contact Us
                    </Link>
                    <Link to="/faq" className="text-[#FF6B35] hover:underline">
                        FAQ
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
