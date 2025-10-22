import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings as SettingsIcon,
  Info,
  MapPin,
  Home,
  Eye,
  Camera,
  Navigation
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VirtualTour = ({ propertyId, propertyTitle, tourData }) => {
  const { isAuthenticated } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Mock tour data - in real implementation, this would come from props or API
  const mockTourData = {
    scenes: [
      {
        id: 1,
        name: 'Living Room',
        description: 'Spacious living area with modern furnishings',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
        hotspots: [
          { id: 1, x: 30, y: 40, targetScene: 2, label: 'Kitchen' },
          { id: 2, x: 70, y: 35, targetScene: 3, label: 'Bedroom' },
          { id: 3, x: 50, y: 60, targetScene: 4, label: 'Balcony' }
        ],
        audio: null,
        duration: 30
      },
      {
        id: 2,
        name: 'Kitchen',
        description: 'Modern kitchen with stainless steel appliances',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
        hotspots: [
          { id: 4, x: 20, y: 50, targetScene: 1, label: 'Living Room' },
          { id: 5, x: 80, y: 45, targetScene: 5, label: 'Dining Area' }
        ],
        audio: null,
        duration: 25
      },
      {
        id: 3,
        name: 'Master Bedroom',
        description: 'Comfortable master bedroom with en-suite bathroom',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
        hotspots: [
          { id: 6, x: 25, y: 45, targetScene: 1, label: 'Living Room' },
          { id: 7, x: 75, y: 40, targetScene: 6, label: 'Bathroom' }
        ],
        audio: null,
        duration: 20
      },
      {
        id: 4,
        name: 'Balcony',
        description: 'Private balcony with city views',
        image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101',
        hotspots: [
          { id: 8, x: 50, y: 80, targetScene: 1, label: 'Living Room' }
        ],
        audio: null,
        duration: 15
      },
      {
        id: 5,
        name: 'Dining Area',
        description: 'Elegant dining space for entertaining',
        image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000',
        hotspots: [
          { id: 9, x: 30, y: 60, targetScene: 2, label: 'Kitchen' }
        ],
        audio: null,
        duration: 18
      },
      {
        id: 6,
        name: 'Bathroom',
        description: 'Luxurious bathroom with modern fixtures',
        image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101',
        hotspots: [
          { id: 10, x: 50, y: 70, targetScene: 3, label: 'Bedroom' }
        ],
        audio: null,
        duration: 12
      }
    ],
    info: {
      totalDuration: 120, // seconds
      propertySize: '2,400 sq ft',
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2020,
      features: ['Smart Home', 'City Views', 'Modern Appliances', 'Parking']
    }
  };

  const tour = tourData || mockTourData;
  const currentSceneData = tour.scenes[currentScene];

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1;
          if (newProgress >= currentSceneData.duration) {
            // Auto-advance to next scene or loop
            if (currentScene < tour.scenes.length - 1) {
              setCurrentScene(prev => prev + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return currentSceneData.duration;
            }
          }
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentScene, currentSceneData.duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSceneChange = (sceneIndex) => {
    setCurrentScene(sceneIndex);
    setProgress(0);
  };

  const handleHotspotClick = (targetScene) => {
    setCurrentScene(targetScene - 1); // Convert to 0-based index
    setProgress(0);
  };

  const handleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600">Please log in to view virtual tours</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tour Header */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">360° Virtual Tour</h2>
            <p className="text-gray-600">{propertyTitle}</p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleFullscreen}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              <span className="text-sm">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>

            <button
              onClick={() => setShowControls(!showControls)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-sm">Controls</span>
            </button>
          </div>
        </div>

        {/* Property Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-[#FF6B35]">{tour.info.propertySize}</div>
            <div className="text-sm text-gray-600">Property Size</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#FF6B35]">{tour.info.bedrooms}</div>
            <div className="text-sm text-gray-600">Bedrooms</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#FF6B35]">{tour.info.bathrooms}</div>
            <div className="text-sm text-gray-600">Bathrooms</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#FF6B35]">{tour.info.yearBuilt}</div>
            <div className="text-sm text-gray-600">Year Built</div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {tour.info.features.map((feature, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* 360° Viewer */}
      <div
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? 'h-screen' : 'h-96'}`}
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Background Image (representing 360° view) */}
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-500"
          style={{ backgroundImage: `url(${currentSceneData.image})` }}
        />

        {/* Hotspots */}
        {currentSceneData.hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            className="absolute w-8 h-8 bg-white rounded-full border-2 border-[#FF6B35] flex items-center justify-center text-[#FF6B35] font-semibold text-sm hover:scale-110 transition-transform"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handleHotspotClick(hotspot.targetScene)}
            title={`Go to ${hotspot.label}`}
          >
            {hotspot.targetScene}
          </button>
        ))}

        {/* Current Scene Info */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
          <h3 className="font-semibold">{currentSceneData.name}</h3>
          <p className="text-sm opacity-90">{currentSceneData.description}</p>
        </div>

        {/* Controls Overlay */}
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => handleSceneChange(Math.max(0, currentScene - 1))}
                  disabled={currentScene === 0}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-3 rounded-full bg-[#FF6B35] text-white hover:bg-orange-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => handleSceneChange(Math.min(tour.scenes.length - 1, currentScene + 1))}
                  disabled={currentScene === tour.scenes.length - 1}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#FF6B35] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress / currentSceneData.duration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{Math.floor(progress)}s</span>
                  <span>{currentSceneData.duration}s</span>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleMuteToggle}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentScene(0);
                    setProgress(0);
                    setIsPlaying(false);
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-sm">Restart</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Scene Navigation */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour Navigation</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tour.scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => handleSceneChange(index)}
              className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                currentScene === index
                  ? 'border-[#FF6B35] ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={scene.image}
                alt={scene.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <span className={`text-white text-xs font-medium ${
                  currentScene === index ? 'text-orange-200' : ''
                }`}>
                  {scene.name}
                </span>
              </div>

              {currentScene === index && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B35] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Tour Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Tour Progress</span>
            <span>{currentScene + 1} of {tour.scenes.length} scenes</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#FF6B35] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentScene + 1) / tour.scenes.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tour Instructions */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">How to Use the Virtual Tour</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Click on numbered hotspots to navigate between rooms</p>
              <p>• Use the scene thumbnails below to jump to specific areas</p>
              <p>• Click the play button for an automated tour experience</p>
              <p>• Use fullscreen mode for the best immersive experience</p>
              <p>• The tour includes {tour.scenes.length} different scenes covering the entire property</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tour Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
          <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 mb-1">1,247</div>
          <div className="text-sm text-gray-600">Tour Views</div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
          <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 mb-1">2:30</div>
          <div className="text-sm text-gray-600">Avg. Tour Duration</div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
          <Navigation className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 mb-1">89%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTour;
