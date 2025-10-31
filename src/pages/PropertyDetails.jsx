import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PropertyAPI } from '../lib/propertyAPI';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';
import { trackListingViewed } from '../lib/posthog';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  CheckCircle2,
  Grid2X2,
  Check,
  FenceIcon as Fence,
  X,
  Route,
  Building2,
  Shield,
  Lightbulb,
  Droplet,
  AlertCircle,
  Menu,
  Heart,
  Share2,
  Car,
  Home,
  Wind,
  Zap,
  Dumbbell,
  Waves,
  TreePine,
  Wifi,
  MoveUp,
  Camera,
  Grid3X3,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createNewInquiryNotification } from '../services/notificationService';
import { supabase } from '../lib/supabaseClient';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { createConversation } = useMessaging();
  const [currentImage, setCurrentImage] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [movemateEnabled, setMovemateEnabled] = useState(false);

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive images from property data
  const images = property?.images || [];

  React.useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading property with id', id);
        const { success, property: propertyData, error: apiError } = await PropertyAPI.getProperty(id);
        if (!success) {
          console.error('❌ PropertyAPI error:', apiError);
        }
        if (success) {
          setProperty(propertyData);

          // Debug logging to see what avatar data we have
          console.log('🏠 Property loaded with landlord info:', {
            landlord_name: propertyData.landlord_name,
            landlord_profile_image: propertyData.landlord_profile_image,
            landlord_id: propertyData.landlord_id,
            current_user_id: user?.id
          });

          // Track property view for notifications
          if (propertyData?.landlord_id && isAuthenticated && user?.id !== propertyData.landlord_id) {
            await trackPropertyView(propertyData.id, propertyData.landlord_id, propertyData.title);
          }
          
          // Track listing viewed in PostHog
          trackListingViewed({
            id: propertyData.id,
            title: propertyData.title,
            price: propertyData.price,
            location: propertyData.location,
            property_type: propertyData.property_type
          });
        } else {
          setError('Property not found');
        }
      } catch (error) {
        console.error('Error loading property:', error);
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProperty();
    }
  }, [id, isAuthenticated]);

  const trackPropertyView = async (propertyId, landlordId, propertyTitle) => {
    try {
      // Check if property_views table exists and has user_id column
      const { data: tableCheck, error: tableError } = await supabase
        .from('property_views')
        .select('id')
        .limit(1);

      if (tableError) {
        if (tableError.code === '42P01') {
          console.log('ℹ️ property_views table does not exist yet');
          return; // Table doesn't exist, skip tracking
        } else {
          console.warn('⚠️ Error checking property_views table:', tableError.message);
          return; // Skip tracking if table issues
        }
      }

      // Check if required columns exist by trying to select them
      const { data: columnCheck, error: columnError } = await supabase
        .from('property_views')
        .select('*')
        .limit(0);

      if (columnError) {
        console.warn('⚠️ Could not check property_views table structure:', columnError.message);
        return; // Skip tracking if we can't check structure
      }

      const availableColumns = Object.keys(columnCheck || {});
      const hasPropertyId = availableColumns.includes('property_id');
      const hasUserId = availableColumns.includes('viewer_id');

      if (!hasPropertyId || !hasUserId) {
        console.log('ℹ️ property_views table missing required columns, skipping view tracking');
        return; // Skip tracking if required columns don't exist
      }

      // Try to insert property view
      const { error } = await supabase
        .from('property_views')
        .insert([{
          property_id: propertyId,
          viewer_id: user.id
        }]);

      if (error) {
        if (error.message.includes("column 'viewer_id' does not exist") || error.message.includes("column 'user_id' does not exist")) {
          console.log('ℹ️ property_views table exists but required column missing, skipping view tracking');
          return; // Column doesn't exist, skip tracking
        } else {
          console.warn('Property view tracking failed:', error.message);
          return; // Other error, skip tracking
        }
      }

      // Create notification for landlord (if tracking succeeded)
      await createPropertyViewedNotification(landlordId, propertyTitle);

      console.log('✅ Property view tracked and notification sent');
    } catch (error) {
      console.warn('Property view tracking failed:', error.message);
      // Don't fail the entire flow if property view tracking fails
    }
  };

  // Map amenities to icons and labels
  const getAmenityIcon = (amenity) => {
    const amenityMap = {
      'Parking': { Icon: Car, label: 'Parking Available' },
      'Security': { Icon: Shield, label: '24/7 Security' },
      'Water Supply': { Icon: Droplet, label: 'Good Water Supply' },
      'Electricity': { Icon: Lightbulb, label: 'Stable Electricity' },
      'Furnished': { Icon: Home, label: 'Furnished' },
      'Air Conditioning': { Icon: Wind, label: 'Air Conditioning' },
      'Pet Friendly': { Icon: Heart, label: 'Pet Friendly' },
      'Fenced Compound': { Icon: Fence, label: 'Fenced Compound' },
      'Balcony': { Icon: Building2, label: 'Balcony' },
      'Near Main Road': { Icon: Route, label: 'Near Main Road' },
      'Pre-paid Light': { Icon: Lightbulb, label: 'Pre-paid Electricity' },
      'Generator': { Icon: Zap, label: 'Backup Generator' },
      'Gym': { Icon: Dumbbell, label: 'Gym/Fitness Center' },
      'Swimming Pool': { Icon: Waves, label: 'Swimming Pool' },
      'Garden': { Icon: TreePine, label: 'Garden' },
      'Internet': { Icon: Wifi, label: 'Internet Available' },
      'Elevator': { Icon: MoveUp, label: 'Elevator' },
      'CCTV': { Icon: Camera, label: 'CCTV Surveillance' },
      'Borehole': { Icon: Droplet, label: 'Borehole Water' },
      'Tiled': { Icon: Grid3X3, label: 'Tiled Floors' }
    };
    return amenityMap[amenity] || { Icon: CheckCircle2, label: amenity };
  };

  // Generate features from amenities array
  const features = (property?.amenities || []).map(amenity => getAmenityIcon(amenity));

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleContact = () => {
    setShowBookingModal(true);
  };

  const handleMessageLandlord = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to message the landlord');
      return;
    }

    if (!property?.landlord_id) {
      toast.error('Landlord information not available');
      return;
    }

    try {
      // Create conversation with landlord
      const conversation = await createConversation(property.landlord_id);

      if (conversation) {
        toast.success('Conversation started with landlord!');
        // Navigate to message center with the conversation
        navigate('/message-center');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
    }
  };

  const handleConfirmBooking = async () => {
    try {
      // Get form data
      const phoneNumber = document.querySelector('#phone-number').value;
      const moveInDate = document.querySelector('input[type="date"]').value;
      const leaseDuration = document.querySelector('select').value;
      const specialRequests = document.querySelector('textarea').value;
      const agreedToTerms = document.querySelector('#booking-terms').checked;

      // Validate required fields
      if (!phoneNumber || !moveInDate || !agreedToTerms) {
        toast.error('Please fill in all required fields (phone number, move-in date) and agree to terms');
        return;
      }

      // Get user name - check various possible fields
      const getUserName = () => {
        if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
        if (user?.user_metadata?.name) return user.user_metadata.name;
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0]; // Fallback to email username
        return 'Unknown User';
      };

      const userName = getUserName();

      // Refresh the Supabase session first to ensure we have the latest auth state
      await supabase.auth.refreshSession();

      // Get the authenticated user ID directly from Supabase
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        toast.error('Authentication error. Please refresh the page and try again.');
        return;
      }

      if (!authUser) {
        console.error('❌ No authenticated user found in Supabase');
        toast.error('Please log in again to continue.');
        return;
      }

      console.log('🔐 Booking Debug:', {
        userId: user?.id,
        authUserId: authUser?.id,
        authUid: authUser?.id,
        userEmail: user?.email,
        authUserEmail: authUser?.email,
        authError: authError
      });

      // Prepare comprehensive booking data
      const bookingData = {
        // User information
        tenant_id: authUser.id, // Use the authenticated user ID from Supabase
        tenant_name: userName,
        tenant_email: user.email,
        tenant_phone: phoneNumber,

        // Property information
        property_id: property.id,
        property_title: property.title || `${property.bedrooms || 3} Bedroom Apartment`,
        property_location: property.location || 'Location not specified',
        property_price: property.price || 0,
        property_bedrooms: property.bedrooms || property.rooms || 0,
        property_bathrooms: property.bathrooms || 0,
        landlord_id: property.landlord_id,
        landlord_name: property.landlord_name || 'Property Owner',

        // Booking details
        move_in_date: moveInDate,
        lease_duration: parseInt(leaseDuration),
        special_requests: specialRequests || null,
        movemate_enabled: movemateEnabled,
        total_amount: property.price,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('📝 Booking data prepared:', {
        tenant_id: bookingData.tenant_id,
        tenant_email: bookingData.tenant_email,
        property_id: bookingData.property_id
      });

      // Store in database (bookings table)
      const { error: insertError } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (insertError) {
        console.error('Error storing booking in database:', insertError);

        // If bookings table doesn't exist, try to use inquiries table as fallback
        if (insertError.message.includes('relation "bookings" does not exist')) {
          console.log('Bookings table not found, using inquiries table as fallback');

          const fallbackData = {
            renter_id: user.id,
            landlord_id: property.landlord_id,
            property_id: property.id,
            message: `Booking Inquiry - Phone: ${phoneNumber}, Move-in: ${moveInDate}, Duration: ${leaseDuration} months${specialRequests ? ', Special Requests: ' + specialRequests : ''}`
          };

          const { error: fallbackError } = await supabase
            .from('inquiries')
            .insert([fallbackData]);

          if (fallbackError) {
            console.error('Fallback to inquiries table also failed:', fallbackError);
            toast.error('Failed to submit booking. Please try again.');
            return;
          }

          console.log('✅ Booking saved to inquiries table as fallback');
        } else {
          toast.error('Failed to submit booking. Please try again.');
          return;
        }
      } else {
        console.log('✅ Booking saved to bookings table');
      }

      // Also submit to backend API for notifications
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leads/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token || localStorage.getItem('supabase.auth.token')}`
          },
          body: JSON.stringify({
            property_id: property.id,
            landlord_id: property.landlord_id,
            tenant_id: user.id,
            move_in_date: moveInDate,
            lease_duration: parseInt(leaseDuration),
            special_requests: specialRequests || null,
            movemate_enabled: movemateEnabled,
            total_amount: property.price,
            status: 'pending'
          })
        });

        if (!response.ok) {
          console.warn('Backend API call failed, but booking saved to database');
        }
      } catch (apiError) {
        console.warn('Backend API call failed, but booking saved to database:', apiError);
      }

      // Create notifications for both landlord and user
      try {
        // Notify landlord of new booking inquiry
        await createNewInquiryNotification(property.landlord_id, property.title || 'Property');

        console.log('✅ Booking saved and notifications created');
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't fail the booking if notifications fail
      }

      // Show success toast with comprehensive details
      toast.success(
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Booking Submitted Successfully!</p>
            <p className="text-sm text-gray-500">
              Your inquiry for <strong>{property.title || `${property.bedrooms || 3} Bedroom Apartment`}</strong> in <strong>{property.location}</strong> has been sent to the landlord.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              They'll respond within 24 hours with next steps.
            </p>
          </div>
        </div>,
        {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#fff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
        }
      );

      // Close modal
      setShowBookingModal(false);

      // Reset form
      setMovemateEnabled(false);

    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking. Please try again.');
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

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Property not found'}</p>
          <button
            onClick={() => navigate('/chat')}
            className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 overflow-hidden">
        {/* Image Carousel */}
        <div className="relative mb-12 w-full">
          {/* Desktop Carousel - Hidden on mobile */}
          <div className="hidden lg:flex items-center justify-center">
            <button
              onClick={prevImage}
              className="absolute left-8 z-20 bg-black/60 hover:bg-black/80 text-white rounded-lg w-10 h-10 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-6 items-center justify-center">
              {images.length > 0 ? (
                [-1, 0, 1].map((offset) => {
                  const index = (currentImage + offset + images.length) % images.length;
                  const isCenter = offset === 0;
                  return (
                    <div
                      key={`carousel-${offset}`}
                      className={`transition-all duration-500 rounded-2xl overflow-hidden ${
                        isCenter
                          ? "w-[420px] h-[260px] shadow-2xl scale-105 z-10"
                          : "w-[340px] h-[220px] opacity-40 blur-[2px]"
                      }`}
                    >
                      <img
                        src={images[index]}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="w-[420px] h-[260px] bg-gray-100 rounded-2xl flex items-center justify-center">
                  <div className="text-gray-400 text-6xl">🏠</div>
                </div>
              )}
            </div>

            <button
              onClick={nextImage}
              className="absolute right-8 z-20 bg-black/60 hover:bg-black/80 text-white rounded-lg w-10 h-10 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Carousel - Stacked layout */}
          <div className="lg:hidden">
            <div className="relative w-full max-w-full">
              {images.length > 0 ? (
                <div className="relative w-full h-[280px] rounded-2xl overflow-hidden">
                  <img
                    src={images[currentImage]}
                    alt={`Property ${currentImage + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation arrows for mobile */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-[280px] bg-gray-100 rounded-2xl flex items-center justify-center">
                  <div className="text-gray-400 text-6xl">🏠</div>
                </div>
              )}
            </div>

            {/* Mobile image indicators */}
            {images.length > 0 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, index) => (
                  <div
                    key={`mobile-${index}`}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentImage ? "w-6 bg-[#FF6B35]" : "w-2 bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop image indicators */}
          {images.length > 0 && (
            <div className="hidden lg:flex justify-center gap-2 mt-8">
              {images.map((_, index) => (
                <div
                  key={`desktop-${index}`}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentImage ? "w-9 bg-[#FF6B35]" : "w-2 bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="relative">
          {/* Left Column - Main Content */}
          <div className="max-w-4xl">
            {/* Property Info */}
            <div>
              <h2 className="text-2xl font-bold mb-3">
                {property.bedrooms || 3} - Bedroom Flat at<br/>
                {property.location || 'Location not specified'}
              </h2>
              <div className="flex items-start gap-2 text-gray-400 mb-3">
                <MapPin className="w-[18px] h-[18px] mt-0.5 flex-shrink-0" />
                <span className="text-sm">{property.location || 'Location not specified'}</span>
              </div>
              <div className="flex items-center gap-5 text-gray-400 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Bed className="w-[18px] h-[18px]" />
                  <span>{property.bedrooms || property.rooms || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-[18px] h-[18px]" />
                  <span>{property.bathrooms || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-[18px] h-[18px]" />
                  <span>{property.area ? `${property.area} sq.ft` : 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {property.landlord_profile_image ? (
                  <img
                    src={property.landlord_profile_image}
                    alt={property.landlord_name || "Landlord"}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {(property.landlord_name || 'L').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium">{property.landlord_name || 'Property Owner'}</span>
                <CheckCircle2 className="w-[18px] h-[18px] text-[#FF6B35] fill-[#FF6B35]" />

                {/* Message Landlord Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMessageLandlord}
                  className="ml-2 p-2 rounded-full bg-[#FF6B35] text-white hover:bg-orange-600 transition-colors"
                  title="Message Landlord"
                >
                  <MessageSquare className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base font-semibold mb-3">Description:</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {property.description || 'No description available for this property.'}
              </p>
            </div>

            {/* Features - Full Width */}
            {features.length > 0 && (
              <div className="w-full">
                <h3 className="text-xs font-semibold mb-4 text-gray-400 tracking-wider">FEATURES:</h3>
                <div className="flex flex-wrap gap-3">
                  {features.map((feature, index) => {
                    const Icon = feature.Icon;
                    return (
                      <div
                        key={`feature-${index}`}
                        className="px-4 py-2.5 rounded-full border border-gray-200 bg-transparent text-sm flex items-center gap-2.5"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-gray-900">{feature.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Map */}
            <div>
              <h3 className="text-xs font-semibold mb-4 text-gray-400 tracking-wider">LOCATION:</h3>
              <div className="w-full h-[280px] rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/static/${property.location ? '6.7428,6.4444' : '6.7428,6.4444'},13,0/800x340@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTFrOXo0bW4wNHVqMmtzNHRqN2VlcWJnIn0.r7l1-TSHXWKQ2NNFUwFCfA`}
                  alt="Map"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Property Reviews Section */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reviews Coming Soon</h3>
              <p className="text-gray-600">Property reviews will be available soon.</p>
            </div>
          </div>

          {/* Virtual Tour Section */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Virtual Tour Coming Soon</h3>
              <p className="text-gray-600">360° virtual tours will be available soon.</p>
            </div>
          </div>

          {/* Right Column - Floating Payment Card */}
          <div className="lg:absolute lg:top-0 lg:right-0 lg:w-80 xl:w-96 lg:ml-8">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5 lg:shadow-lg">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Duration:</p>
                <p className="text-base">Yearly</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Payment Breakdown:</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rent:</span>
                  <span className="font-medium">₦ {property.price?.toLocaleString() || '0'}<span className="text-gray-400 text-xs">/year</span></span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total:</p>
                <p className="text-3xl font-bold">₦ {property.price?.toLocaleString() || '0'}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="font-semibold text-gray-900">Note:</span> that the agency fee is only 10% of the House rent.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#FF6B35] bg-gray-100 border-gray-300 rounded focus:ring-[#FF6B35] focus:ring-2"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer leading-relaxed">
                    I have read and agreed to the{" "}
                    <span className="underline text-gray-900 font-medium">Terms of Service</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-5 mt-12 max-w-2xl mx-auto pb-8">
          <button
            onClick={handleContact}
            className="rounded-full text-base h-14 bg-[#FF6B35] text-white hover:bg-orange-600 font-medium transition-colors"
          >
            Book Space
          </button>
          <button
            className="rounded-full text-base h-14 border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white font-medium transition-colors"
          >
            Book Tour
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Book This Space</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Property Summary */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <img
                  src={images[0] || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=80&h=80&fit=crop"}
                  alt={property.title}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {property.bedrooms || 3} Bedroom Apartment
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {property.location || 'Location not specified'}
                  </p>
                  <p className="text-lg font-bold text-[#FF6B35]">
                    ₦ {property.price?.toLocaleString() || '0'}/year
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Options */}
            <div className="p-6 space-y-6">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone-number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Move-in Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Move-in Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  placeholder="Select date"
                />
              </div>

              {/* Lease Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lease Duration
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]">
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="6">6 Months</option>
                </select>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] resize-none"
                  placeholder="Any special requirements or questions..."
                />
              </div>

              {/* Movemate */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Movemate</h3>
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">NEW</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMovemateEnabled(!movemateEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      movemateEnabled ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        movemateEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-gray-600 mb-2">
                  A Movemate is a personal guide for house tours, helping renters and
                  buyers visit properties with ease and confidence.{" "}
                  <span className="text-blue-500 cursor-pointer hover:underline">Learn More</span>
                </p>

                <div className="text-xs text-gray-600">
                  Turn On (Optional)
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="booking-terms"
                  className="mt-1 w-4 h-4 text-[#FF6B35] bg-gray-100 border-gray-300 rounded focus:ring-[#FF6B35] focus:ring-2"
                />
                <label htmlFor="booking-terms" className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{" "}
                  <span className="text-[#FF6B35] font-medium">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-[#FF6B35] font-medium">Privacy Policy</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 px-4 py-3 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Confirm Booking
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
