// src/pages/SavedProperties.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Home, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PropertyAPI } from '../lib/propertyAPI';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import ProfilePopup from '../components/ProfilePopup';
import NotificationCenter from '../components/NotificationCenter';

/**
 * Premium Saved Properties page.
 * Features:
 *   • Glass‑morphism card design with subtle micro‑animations.
 *   • Real‑time updates via Supabase channel.
 *   • Graceful loading, empty‑state and error handling.
 *   • Responsive grid (1‑4 columns depending on viewport).
 */
export default function SavedProperties() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug: Track authentication state
  useEffect(() => {
    console.log('💾 SavedProperties Auth State:', {
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
      hasUser: !!user
    });
  }, [isAuthenticated, user?.id, user?.email]);

  // Wait for user data to be available before attempting to load
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (user !== undefined && user !== null) {
      setAuthReady(true);
      console.log('✅ User data available, setting authReady=true');
    }
  }, [user]);

  // ---------------------------------------------------------------------
  // Real‑time subscription – keep UI in sync when user saves/unsaves.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!authReady || !isAuthenticated || !user?.id) {
      console.log('⏸️ Skipping subscription setup - authReady:', authReady, 'isAuthenticated:', isAuthenticated, 'userId:', user?.id);
      return;
    }
    console.log('📡 Setting up real-time subscription for user:', user.id);
    const channel = supabase
      .channel('saved_properties_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'saved_properties',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        console.log('📡 Real‑time saved‑properties update', payload);
        loadSavedProperties();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAuthenticated, user?.id]);

  // ---------------------------------------------------------------------
  // Load saved properties from the API.
  // ---------------------------------------------------------------------
  const loadSavedProperties = async () => {
    console.log('💾 loadSavedProperties called:', { userId: user?.id, isAuthenticated, authReady });
    if (!authReady || !user?.id) {
      console.log('❌ No user ID or auth not ready, skipping loadSavedProperties');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('💾 Calling PropertyAPI.getSavedProperties for user:', user.id);
      const result = await PropertyAPI.getSavedProperties(user.id);
      console.log('💾 PropertyAPI result:', result);
      if (result.success) {
        console.log('✅ Saved properties loaded successfully:', result.savedProperties?.length || 0);
        setSavedProperties(result.savedProperties || []);
      } else {
        console.error('❌ PropertyAPI failed:', result);
        setError(result.error || 'Failed to load saved properties');
        toast.error(result.error || 'Failed to load saved properties');
      }
    } catch (e) {
      console.error('❌ loadSavedProperties exception', e);
      setError(e.message || 'Unexpected error');
      toast.error(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // Initial fetch.
  // ---------------------------------------------------------------------
  useEffect(() => {
    console.log('📡 Initial fetch effect triggered - authReady:', authReady, 'isAuthenticated:', isAuthenticated, 'userId:', user?.id);
    if (authReady && isAuthenticated && user?.id) {
      loadSavedProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAuthenticated, user?.id]);

  // ---------------------------------------------------------------------
  // Remove a property from saved list.
  // ---------------------------------------------------------------------
  const handleRemove = async propertyId => {
    try {
      const { success, action } = await PropertyAPI.toggleSaveProperty(user.id, propertyId);
      if (success && action === 'removed') {
        setSavedProperties(prev => prev.filter(p => p.property_id !== propertyId));
        toast.success('Removed from saved');
      } else {
        toast.error('Could not remove property');
      }
    } catch (e) {
      console.error('remove error', e);
      toast.error('Could not remove property');
    }
  };

  // ---------------------------------------------------------------------
  // UI helpers – glass‑morphism style objects.
  // ---------------------------------------------------------------------
  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    position: 'relative',
  };

  const imgStyle = {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  };

  const overlayBtn = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(255,255,255,0.7)',
    borderRadius: '50%',
    padding: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };

  // ---------------------------------------------------------------------
  // Render helpers.
  // ---------------------------------------------------------------------
  const renderHeader = () => (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <button
        onClick={() => navigate('/chat')}
        className="p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Back to home"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-semibold text-gray-800">Saved Properties</h1>
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <ProfilePopup />
      </div>
    </header>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full mb-4"
      />
      <p className="text-gray-600">Loading saved properties…</p>
    </div>
  );

  const renderError = () => (
    <div className="max-w-md mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
      <div className="text-5xl text-yellow-500 mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-yellow-900 mb-2">Unable to load saved properties</h2>
      <p className="text-yellow-700 mb-4">{error}</p>
      <button
        onClick={loadSavedProperties}
        className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
      >
        Retry
      </button>
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Heart className="w-20 h-20 text-gray-400 mb-4" />
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Saved Properties</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        You haven’t saved any properties yet. Browse listings and click the heart icon to save them for later.
      </p>
      <button
        onClick={() => navigate('/browse')}
        className="px-6 py-2 bg-[#FF6B35] text-white rounded hover:bg-[#e85e2f] transition"
      >
        Browse Listings
      </button>
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {savedProperties.map(item => {
        const property = item.properties;
        if (!property) return null;
        return (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => navigate(`/properties/${property.id}`, { state: { property } })}
          >
            <div style={cardStyle} className="group">
              {/* Image */}
              <div className="relative overflow-hidden">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    style={imgStyle}
                    className="group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center bg-gray-100" style={{ height: '200px' }}>
                    <Home className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {/* Unsave button */}
                <button
                  onClick={e => { e.stopPropagation(); handleRemove(property.id); }}
                  style={overlayBtn}
                  className="hover:bg-white"
                  aria-label="Remove from saved"
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </button>
              </div>
              {/* Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate mb-1">
                  {property.title}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {property.location?.split(',')[0] || 'Location'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {property.bedrooms || 0} bed • {property.bathrooms || 0} bath
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    ₦{property.price?.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">/ month</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  // ---------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Heart className="w-20 h-20 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
        <p className="text-gray-600 mb-6">Please log in to view your saved properties.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-[#FF6B35] text-white rounded hover:bg-[#e85e2f] transition"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderHeader()}
      <main className="flex-grow">
        {loading && renderLoading()}
        {error && renderError()}
        {!loading && !error && savedProperties.length === 0 && renderEmpty()}
        {!loading && !error && savedProperties.length > 0 && renderGrid()}
      </main>
    </div>
  );
}
