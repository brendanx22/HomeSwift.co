import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Square, ArrowLeft, Home, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { PropertyAPI } from '../lib/propertyAPI';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function SavedProperties() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (loading && isMounted) {
        console.warn('⚠️ Safety timeout reached for saved properties loading');
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 30000); // 30 seconds timeout

    if (isAuthenticated && user?.id) {
      loadSavedProperties();

      // Set up real-time subscription for saved_properties table
      const subscription = supabase
        .channel('saved_properties_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'saved_properties',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('📡 Real-time update received:', payload);
            // Reload saved properties when changes occur
            loadSavedProperties();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        isMounted = false;
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
      return () => {
        isMounted = false;
        clearTimeout(safetyTimeout);
      };
    }
  }, [isAuthenticated, user?.id]);

  const loadSavedProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading saved properties for user:', user.id);
      const result = await PropertyAPI.getSavedProperties(user.id);
      console.log('📋 Result from API:', result);

      if (result.success) {
        console.log('✅ Saved properties loaded:', result.savedProperties?.length || 0);
        setSavedProperties(result.savedProperties || []);
      } else {
        console.error('❌ Failed to load saved properties:', result.error);
        setError(result.error || 'Failed to load saved properties');
      }
    } catch (error) {
      console.error('❌ Exception loading saved properties:', error);
      setError(error.message || 'Failed to load saved properties');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromSaved = async (propertyId) => {
    try {
      const { success, action } = await PropertyAPI.toggleSaveProperty(user.id, propertyId);

      if (success) {
        if (action === 'removed') {
          // Remove from local state
          setSavedProperties(prev => prev.filter(item => item.property_id !== propertyId));
          toast.success('Removed from favorites');
        }
      } else {
        toast.error('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing from saved:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your saved properties</p>
          <button
            onClick={() => navigate('/login')}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#FF6B35' }}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading saved properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo & Back */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Link to="/chat" className="flex items-center">
                <img
                  src="/images/logo.png"
                  alt="HomeSwift"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-[1760px] mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Saved Properties</h1>
          <p className="text-gray-600">{savedProperties.length} {savedProperties.length === 1 ? 'property' : 'properties'} saved</p>
        </div>

        {error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Unable to Load Saved Properties</h2>
            <p className="text-yellow-700 mb-4">
              We're experiencing issues loading your saved properties. This is usually due to high server load.
            </p>
            <div className="bg-white rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Troubleshooting tips:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Try again in a few minutes</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Browse Properties
              </button>
            </div>
            {error && (
              <details className="mt-4 text-left max-w-md mx-auto">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Technical details
                </summary>
                <p className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  {error}
                </p>
              </details>
            )}
          </div>
        ) : savedProperties.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Saved Properties</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't saved any properties yet. Start browsing and save properties you're interested in for easy access later.
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Start Browsing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedProperties.map((savedItem) => {
              const property = savedItem.properties;
              if (!property) return null;

              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/properties/${property.id}`, { state: { property } })}
                >
                  {/* Image Section */}
                  <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromSaved(property.id);
                      }}
                      className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
                    >
                      <Heart className="w-6 h-6 text-red-500 fill-red-500 drop-shadow-md" />
                    </button>
                  </div>

                  {/* Property Info */}
                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {property.location?.split(',')[0] || 'Location'}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">★</span>
                        <span className="text-sm font-medium">4.9</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-1 line-clamp-1">
                      {property.title}
                    </p>
                    <p className="text-gray-600 text-sm mb-2">
                      {property.bedrooms || 0} bed • {property.bathrooms || 0} bath
                    </p>
                    <div>
                      <span className="font-semibold text-gray-900">
                        ₦{property.price?.toLocaleString()}
                      </span>
                      <span className="text-gray-600 text-sm"> /year</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
