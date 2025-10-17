import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyAPI } from '../lib/propertyAPI';
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
  Grid3X3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [movemateEnabled, setMovemateEnabled] = useState(false);

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        const { success, property: propertyData } = await PropertyAPI.getProperty(id);
        if (success) {
          setProperty(propertyData);
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
  }, [id]);

  const images = property?.images || [];

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

  const handleContact = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book this space');
      return;
    }

    // Show booking modal
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    try {
      // Get form data
      const moveInDate = document.querySelector('input[type="date"]').value;
      const leaseDuration = document.querySelector('select').value;
      const specialRequests = document.querySelector('textarea').value;
      const agreedToTerms = document.querySelector('#booking-terms').checked;

      // Validate required fields
      if (!moveInDate || !agreedToTerms) {
        toast.error('Please fill in all required fields and agree to terms');
        return;
      }

      // Prepare booking data
      const bookingData = {
        property_id: property.id,
        landlord_id: property.landlord_id,
        tenant_id: user.id,
        move_in_date: moveInDate,
        lease_duration: parseInt(leaseDuration),
        special_requests: specialRequests || null,
        movemate_enabled: movemateEnabled,
        total_amount: property.price,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Submit to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token || localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit booking');
      }

      const result = await response.json();

      // Show success toast with property details
      toast.success(
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Booking Submitted Successfully!</p>
            <p className="text-sm text-gray-500">
              Your inquiry has been sent to the landlord. They'll respond within 24 hours.
            </p>
          </div>
        </div>,
        {
          duration: 5000,
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

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Image Carousel */}
        <div className="relative mb-12">
          <div className="flex items-center justify-center">
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
                      key={index}
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

          {images.length > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              {images.map((_, index) => (
                <div
                  key={index}
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
                <img
                  src={property.landlord_profile_image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                  alt={property.landlord_name || "Landlord"}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <span className="text-sm font-medium">{property.landlord_name || 'Landlord'}</span>
                <CheckCircle2 className="w-[18px] h-[18px] text-[#FF6B35] fill-[#FF6B35]" />
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
                        key={index}
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
