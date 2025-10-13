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
  Heart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VirtualTours = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mock tour data - replace with real API calls
  useEffect(() => {
    const loadTours = async () => {
      // Simulate API call
      setTimeout(() => {
        setTours([
          {
            id: 1,
            title: 'Luxury Villa in Victoria Island',
            location: 'Victoria Island, Lagos',
            price: '₦150M',
            bedrooms: 5,
            bathrooms: 4,
            area: '450 sqm',
            thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            videoUrl: 'https://example.com/virtual-tour-1',
            description: 'Stunning luxury villa with panoramic city views, private pool, and premium finishes throughout.',
            features: ['Swimming Pool', 'Home Theater', 'Wine Cellar', 'Smart Home System']
          },
          {
            id: 2,
            title: 'Modern Apartment in Lekki',
            location: 'Lekki Phase 1, Lagos',
            price: '₦85M',
            bedrooms: 3,
            bathrooms: 3,
            area: '180 sqm',
            thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            videoUrl: 'https://example.com/virtual-tour-2',
            description: 'Contemporary apartment with floor-to-ceiling windows, modern kitchen, and balcony with ocean views.',
            features: ['Ocean View', 'Modern Kitchen', 'Balcony', 'Security System']
          },
          {
            id: 3,
            title: 'Executive Home in Maitama',
            location: 'Maitama, Abuja',
            price: '₦120M',
            bedrooms: 4,
            bathrooms: 4,
            area: '320 sqm',
            thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            videoUrl: 'https://example.com/virtual-tour-3',
            description: 'Elegant executive residence in prestigious Maitama district with diplomatic quarter proximity.',
            features: ['Garden', 'Study Room', 'Guest Suite', '2-Car Garage']
          }
        ]);
        setLoading(false);
      }, 1500);
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
          {tours.map((tour, index) => (
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
          ))}
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
