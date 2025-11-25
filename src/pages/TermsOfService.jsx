import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
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
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
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
                            Welcome to HomeSwift ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the HomeSwift platform, including our website, mobile applications, and services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                        </p>
                    </section>

                    {/* Acceptance */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            By creating an account or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-blue-900 text-sm">
                                    You must be at least 18 years old to use HomeSwift. By using our Service, you represent that you are of legal age to form a binding contract.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* User Accounts */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Account Creation</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    To use certain features of our Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2 Account Security</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.3 Account Types</h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                    <li><strong>Renter Accounts:</strong> For individuals seeking rental properties</li>
                                    <li><strong>Landlord Accounts:</strong> For property owners listing rentals</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Service Usage */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Use of Service</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.1 Permitted Use</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
                                    <li>In any way that violates any applicable law or regulation</li>
                                    <li>To transmit any fraudulent, misleading, or deceptive content</li>
                                    <li>To harass, abuse, or harm another person</li>
                                    <li>To impersonate or attempt to impersonate HomeSwift or another user</li>
                                    <li>To interfere with or disrupt the Service or servers</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Property Listings */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Property Listings</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">5.1 Landlord Responsibilities</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    Landlords are responsible for the accuracy and legality of their property listings. All listings must:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
                                    <li>Contain accurate and truthful information</li>
                                    <li>Comply with fair housing laws and regulations</li>
                                    <li>Include current and accurate pricing</li>
                                    <li>Feature genuine photographs of the property</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">5.2 Prohibited Content</h3>
                                <p className="text-gray-700 leading-relaxed">
                                    Listings must not contain discriminatory language, false information, or content that violates any laws or regulations.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Payments and Fees */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payments and Fees</h2>
                        <p className="text-gray-700 leading-relaxed">
                            HomeSwift may charge fees for certain services. All fees are non-refundable unless otherwise stated. We reserve the right to change our fees at any time with reasonable notice.
                        </p>
                    </section>

                    {/* Intellectual Property */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
                        <p className="text-gray-700 leading-relaxed">
                            The Service and its original content, features, and functionality are owned by HomeSwift and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                        </p>
                    </section>

                    {/* Disclaimer */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <p className="text-yellow-900 text-sm leading-relaxed">
                                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. HOMESWIFT DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                            </p>
                        </div>
                    </section>

                    {/* Limitation of Liability */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
                        <p className="text-gray-700 leading-relaxed">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, HOMESWIFT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                        </p>
                    </section>

                    {/* Termination */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
                        </p>
                    </section>

                    {/* Changes to Terms */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
                        </p>
                    </section>

                    {/* Governing Law */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
                        <p className="text-gray-700 leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which HomeSwift operates, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            If you have any questions about these Terms, please contact us:
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-gray-700"><strong>Email:</strong> legal@homeswift.co</p>
                            <p className="text-gray-700"><strong>Address:</strong> [Your Business Address]</p>
                        </div>
                    </section>
                </motion.div>

                {/* Footer Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 text-center space-x-6"
                >
                    <Link to="/privacy" className="text-[#FF6B35] hover:underline">
                        Privacy Policy
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

export default TermsOfService;
