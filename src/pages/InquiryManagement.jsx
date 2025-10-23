import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  MapPin,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  User,
  Building,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  Download,
  ExternalLink
} from 'lucide-react';

const InquiryManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const { createConversation } = useMessaging();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showInquiryDetails, setShowInquiryDetails] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/landlord/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Load inquiries
  useEffect(() => {
    loadInquiries();
  }, [user]);

  // Filter inquiries based on search and status
  useEffect(() => {
    let filtered = inquiries;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inquiry =>
        inquiry.tenant_name?.toLowerCase().includes(query) ||
        inquiry.property_title?.toLowerCase().includes(query) ||
        inquiry.property_location?.toLowerCase().includes(query) ||
        inquiry.tenant_email?.toLowerCase().includes(query)
      );
    }

    setFilteredInquiries(filtered);
  }, [inquiries, searchQuery, statusFilter]);

  const loadInquiries = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);

      // Get bookings for properties owned by this landlord
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          tenant_name,
          tenant_email,
          tenant_phone,
          property_id,
          property_title,
          property_location,
          property_price,
          property_bedrooms,
          property_bathrooms,
          landlord_id,
          landlord_name,
          move_in_date,
          lease_duration,
          special_requests,
          movemate_enabled,
          total_amount,
          status,
          created_at,
          updated_at
        `)
        .eq('landlord_id', user.id) // Only show bookings for this landlord's properties
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        toast.error('Failed to load inquiries');
        return;
      }

      // Transform bookings data to match the expected format
      const inquiries = bookings?.map(booking => ({
        id: booking.id,
        property_id: booking.property_id,
        property_title: booking.property_title,
        property_location: booking.property_location,
        property_price: booking.property_price,
        tenant_id: booking.tenant_id,
        tenant_name: booking.tenant_name,
        tenant_email: booking.tenant_email,
        tenant_phone: booking.tenant_phone,
        move_in_date: booking.move_in_date,
        lease_duration: booking.lease_duration,
        special_requests: booking.special_requests,
        movemate_enabled: booking.movemate_enabled,
        total_amount: booking.total_amount,
        status: booking.status,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        priority: 'medium' // Default priority, can be enhanced later
      })) || [];

      console.log('✅ Loaded inquiries from bookings table:', inquiries.length);
      setInquiries(inquiries);
    } catch (error) {
      console.error('Error loading inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      // Update the booking status in the database
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', inquiryId);

      if (error) {
        console.error('Error updating booking status:', error);
        toast.error('Failed to update inquiry status');
        return;
      }

      // Update local state
      setInquiries(prev =>
        prev.map(inquiry =>
          inquiry.id === inquiryId
            ? { ...inquiry, status: newStatus, updated_at: new Date().toISOString() }
            : inquiry
        )
      );

      toast.success(`Inquiry ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'marked as pending'}`);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      toast.error('Failed to update inquiry status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gray-50"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full"
        />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/landlord/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inquiry Management</h1>
                <p className="text-sm text-gray-600">Manage property inquiries and leads</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">+12% from last month</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inquiries.filter(i => i.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inquiries.filter(i => i.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inquiries.length > 0 ? Math.round((inquiries.filter(i => i.status === 'approved').length / inquiries.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search inquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Inquiries ({filteredInquiries.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredInquiries.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No inquiries have been submitted yet'
                  }
                </p>
              </div>
            ) : (
              filteredInquiries.map((inquiry) => (
                <motion.div
                  key={inquiry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedInquiry(inquiry);
                    setShowInquiryDetails(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-medium">
                          {inquiry.tenant_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{inquiry.tenant_name}</h3>
                          <p className="text-sm text-gray-600">{inquiry.tenant_email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-4 h-4 mr-2" />
                          {inquiry.property_title}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {inquiry.property_location}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Move in: {formatDate(inquiry.move_in_date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(inquiry.status)}`}>
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {inquiry.special_requests && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Special requests:</strong> {inquiry.special_requests}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          ₦{inquiry.property_price.toLocaleString()}/year • {inquiry.lease_duration} months
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(inquiry.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inquiry Details Modal */}
      {showInquiryDetails && selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Inquiry Details</h2>
                <button
                  onClick={() => setShowInquiryDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Inquiry Content */}
            <div className="p-6 space-y-6">
              {/* Tenant Info */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedInquiry.tenant_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedInquiry.tenant_name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedInquiry.tenant_email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedInquiry.tenant_phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Property Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Property</p>
                    <p className="text-sm text-gray-600">{selectedInquiry.property_title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-sm text-gray-600">{selectedInquiry.property_location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Price</p>
                    <p className="text-sm text-gray-600">₦{selectedInquiry.property_price.toLocaleString()}/year</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Lease Duration</p>
                    <p className="text-sm text-gray-600">{selectedInquiry.lease_duration} months</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Move-in Date</p>
                    <p className="text-sm text-gray-600">{formatDate(selectedInquiry.move_in_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Movemate</p>
                    <p className="text-sm text-gray-600">
                      {selectedInquiry.movemate_enabled ? 'Enabled' : 'Not requested'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-700">Total Amount</p>
                    <p className="text-lg font-bold text-[#FF6B35]">
                      ₦{selectedInquiry.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedInquiry.special_requests && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Special Requests</h4>
                  <p className="text-sm text-gray-600">{selectedInquiry.special_requests}</p>
                </div>
              )}

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedInquiry.status)}`}>
                    {selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1)}
                  </span>
                  <span className={`text-sm ${getPriorityColor(selectedInquiry.priority)}`}>
                    Priority: {selectedInquiry.priority}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      handleMessageTenant(selectedInquiry.tenant_id);
                      setShowInquiryDetails(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35] rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Message
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <ExternalLink className="w-4 h-4 inline mr-2" />
                    View Property
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              {selectedInquiry.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      updateInquiryStatus(selectedInquiry.id, 'rejected');
                      setShowInquiryDetails(false);
                    }}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      updateInquiryStatus(selectedInquiry.id, 'approved');
                      setShowInquiryDetails(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                onClick={() => setShowInquiryDetails(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedInquiry.status === 'pending'
                    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-[#FF6B35] text-white hover:bg-orange-600'
                }`}
              >
                {selectedInquiry.status === 'pending' ? 'Close' : 'Done'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InquiryManagement;
