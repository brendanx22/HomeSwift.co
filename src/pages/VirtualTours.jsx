import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Home,
  MapPin,
  Calendar,
  Eye,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PropertyAPI } from '../lib/propertyAPI';

const VirtualTours = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const loadTours = async () => {
      try {
        setLoading(true);

        // Fetch featured properties for virtual tours
        const { success, properties } = await PropertyAPI.getProperties();

        if (success && properties && properties.length > 0) {
          // Filter properties that could have virtual tours (featured properties with images)
          const tourProperties = properties
            .filter(property => property.is_featured && property.images && property.images.length > 0)
            .slice(0, 3); // Show top 3 featured properties

          // Transform properties into virtual tour data
          const tourData = tourProperties.map(property => ({
            id: property.id,
            title: property.title,
            location: property.location,
            price: `₦${property.price?.toLocaleString() || '0'}`,
            bedrooms: property.bedrooms || property.rooms || 0,
            bathrooms: property.bathrooms || 0,
            area: property.area ? `${property.area} sq ft` : 'N/A',
            thumbnail: property.images[0],
            videoUrl: `virtual-tour-${property.id}`, // Placeholder for actual virtual tour URL
            description: property.description || `Beautiful ${property.property_type || 'property'} located in ${property.location}. Features modern amenities and excellent location.`,
            features: [
              property.bedrooms > 2 ? 'Spacious Bedrooms' : 'Cozy Bedrooms',
              property.bathrooms > 1 ? 'Multiple Bathrooms' : 'Modern Bathroom',
              property.area > 200 ? 'Large Living Space' : 'Comfortable Space',
              'Prime Location'
            ]
          }));

          setTours(tourData);
        } else {
          // Fallback to empty state if no featured properties
          setTours([]);
        }
      } catch (error) {
        console.error('Error loading virtual tours:', error);
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    loadTours();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Chat</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
          </div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Virtual Tours</h1>
          <p className="text-gray-600">Experience properties from the comfort of your home with immersive 360° virtual tours</p>
        </motion.div>

        {/* Featured Tour */}
        {selectedTour && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200"
          >
            <div className="relative bg-black">
              {/* Video Player Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">360° Virtual Tour</p>
                  <p className="text-sm opacity-75">Interactive panoramic view of {selectedTour.title}</p>
                </div>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 rounded-full px-6 py-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:text-[#FF6B35] transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-[#FF6B35] transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button className="text-white hover:text-[#FF6B35] transition-colors">
                  <Maximize size={20} />
                </button>
              </div>
            </div>

            {/* Tour Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">{selectedTour.title}</h2>
                  <p className="text-gray-600 flex items-center gap-1 mb-2">
                    <MapPin size={16} />
                    {selectedTour.location}
                  </p>
                  <p className="text-[#FF6B35] text-xl font-bold">{selectedTour.price}</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Heart size={24} />
                </button>
              </div>

              <p className="text-gray-700 mb-4">{selectedTour.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTour.features.map((feature, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {feature}
                  </span>
                ))}
              </div>

              <button className="w-full bg-[#FF6B35] text-white py-3 rounded-lg font-semibold hover:bg-[#e85e2f] transition-colors">
                Schedule In-Person Viewing
              </button>
            </div>
          </motion.div>
        )}

        {/* Tour Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours && tours.length > 0 ? tours.map((tour, index) => (
            <motion.div
              key={tour.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedTour(tour)}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={tour.thumbnail}
                  alt={tour.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3">
                    <Play className="text-[#FF6B35]" size={24} />
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  360° Tour
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-[#2C3E50] mb-2 line-clamp-2">{tour.title}</h3>
                <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
                  <MapPin size={14} />
                  {tour.location}
                </p>
                <p className="text-[#FF6B35] font-bold text-lg mb-3">{tour.price}</p>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>{tour.bedrooms} beds</span>
                  <span>{tour.bathrooms} baths</span>
                  <span>{tour.area}</span>
                </div>

                <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  View Tour
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full bg-white rounded-xl p-12 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Virtual Tours Available</h3>
              <p className="text-gray-600 mb-6">
                Virtual tours will be available for featured properties. Check back soon for immersive property experiences.
              </p>
              <button className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      style={{ backgroundColor: '#FF6B35' }}>
                Browse Featured Properties
              </button>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-[#FF6B35] to-[#e85e2f] rounded-xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Want to Add Your Property to Virtual Tours?</h2>
          <p className="text-lg mb-6 opacity-90">
            Showcase your properties with professional 360° virtual tours and reach more potential buyers
          </p>
          <button className="bg-white text-[#FF6B35] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            List Your Property
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VirtualTours;
