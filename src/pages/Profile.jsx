import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Settings as SettingsIcon, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        // Load profile from user_profiles table
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', profileError);
        }

        if (profile) {
          console.log('🔍 Profile - Loading profile from database:', {
            fullName: profile.full_name,
            email: profile.email
          });

          setProfileData({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            location: profile.location || '',
            bio: profile.bio || ''
          });
        } else {
          // No profile exists, use user auth data
          console.log('🔍 Profile - No profile found, using auth data');

          setProfileData({
            full_name: user.user_metadata?.full_name || '',
            phone: '',
            location: '',
            bio: ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        // Fallback to user auth data
        setProfileData({
          full_name: user.user_metadata?.full_name || '',
          phone: '',
          location: '',
          bio: ''
        });
      }
    };

    loadProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsEditing(false);

      // Save profile data to user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('✅ Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleCancel = async () => {
    // Reload profile data from database
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          location: profile.location || '',
          bio: profile.bio || ''
        });
      } else {
        // Fallback to auth data
        setProfileData({
          full_name: user.user_metadata?.full_name || '',
          phone: '',
          location: '',
          bio: ''
        });
      }
    } catch (err) {
      console.error('Error reloading profile:', err);
      // Fallback to auth data
      setProfileData({
        full_name: user.user_metadata?.full_name || '',
        phone: '',
        location: '',
        bio: ''
      });
    }

    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
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

  // Helper component for settings rows
  const SettingsRow = ({ label, value, actionLabel = 'Edit', onAction, isEditing, children }) => (
    <div className="settings-row">
      <div className="settings-row-info">
        <div className="settings-label">{label}</div>
        {!isEditing ? (
          <div className="settings-value">{value || `Not provided`}</div>
        ) : (
          <div className="mt-4">{children}</div>
        )}
      </div>
      {!isEditing ? (
        <button onClick={onAction} className="settings-action">
          {value ? actionLabel : 'Add'}
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-50 pt-safe">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <img src="/images/logo.png" alt="HomeSwift" className="h-8 w-auto object-contain" />
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
        >
          Done
        </button>
      </header>

      <main className="settings-container">
        <div className="settings-grid">
          {/* Sidebar */}
          <aside className="settings-sidebar text-center">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm inline-block w-full">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-[#FF6B35] to-orange-600 rounded-full flex items-center justify-center mx-auto text-4xl font-extrabold text-white shadow-lg">
                  {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full shadow-md text-gray-900 hover:scale-105 transition-transform">
                  <Edit size={16} />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">{profileData.full_name || 'Your Profile'}</h2>
              <p className="text-gray-500 mb-6">Member since {new Date(user?.created_at).getFullYear()}</p>
              
              <div className="pt-6 border-t border-gray-100 space-y-4 text-left">
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm">Verified Account</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <User className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm">2 Reviews from Hosts</span>
                </div>
                {profileData.location && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                    <span className="text-sm">{profileData.location}</span>
                  </div>
                )}
              </div>
            </div>

            <button
               onClick={() => navigate('/settings')}
               className="mt-6 w-full py-4 px-6 border border-gray-900 rounded-xl font-bold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Manage Account
            </button>
          </aside>

          {/* Content Area */}
          <div className="settings-content">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Personal Information</h1>
            <p className="text-gray-500 mb-12">Confirm your information and how we can reach you</p>

            <div className="divide-y divide-gray-100">
              <SettingsRow 
                label="Full name" 
                value={profileData.full_name}
                onAction={() => setIsEditing(true)}
              />
              <SettingsRow 
                label="Email address" 
                value={user?.email}
                actionLabel="Edit"
                onAction={() => toast.error('Email cannot be changed directly')}
              />
              <SettingsRow 
                label="Phone number" 
                value={profileData.phone}
                onAction={() => setIsEditing(true)}
              />
              <SettingsRow 
                label="Location" 
                value={profileData.location}
                onAction={() => setIsEditing(true)}
              />
              <SettingsRow 
                label="About" 
                value={profileData.bio}
                onAction={() => setIsEditing(true)}
              />
            </div>

            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-8 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900">Edit Profile Details</h3>
                  <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                    <SettingsIcon size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="w-full bg-white px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full bg-white px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="+234..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full bg-white px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                        placeholder="e.g. Lagos, Nigeria"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">About (Bio)</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full bg-white px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none transition-all"
                      placeholder="Tell hosts and other users about yourself..."
                    />
                  </div>

                  <div className="flex space-x-4 pt-6 mt-6 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-white border border-gray-300 text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
