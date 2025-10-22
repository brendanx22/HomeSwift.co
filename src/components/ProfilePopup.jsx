import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Edit,
  Settings,
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Save,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const ProfilePopup = ({ isOpen, onClose, position = 'navbar', onAvatarUpdate }) => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: null,
    location: '',
    join_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        // First try to load from user_profiles table (may not exist for all users)
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          // Profile exists in database
          const nameParts = profileData.full_name ? profileData.full_name.split(' ') : ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          console.log('🔍 ProfilePopup - Loading profile from database:', {
            hasAvatar: !!profileData.avatar_url,
            avatarUrl: profileData.avatar_url,
            fullName: profileData.full_name,
            email: profileData.email
          });

          setProfileData({
            first_name: firstName,
            last_name: lastName,
            email: profileData.email || user.email || '',
            phone: profileData.phone || '',
            bio: profileData.bio || '',
            avatar_url: profileData.avatar_url || null,
            location: profileData.location || '',
            join_date: profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'Unknown'
          });
        } else {
          // No profile exists, use user auth data
          const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';
          const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

          console.log('🔍 ProfilePopup - No profile found, using auth data:', {
            firstName,
            lastName,
            email: user.email,
            hasAvatar: false
          });

          setProfileData({
            first_name: firstName,
            last_name: lastName,
            email: user.email || '',
            phone: '',
            bio: '',
            avatar_url: null,
            location: '',
            join_date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        // Fallback to user auth data if profile loading fails
        const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';
        const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

        setProfileData({
          first_name: firstName,
          last_name: lastName,
          email: user.email || '',
          phone: '',
          bio: '',
          avatar_url: null,
          location: '',
          join_date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'
        });
      }
    };

    if (isOpen) {
      loadProfile();
    }
  }, [user, isOpen]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // Combine first and last name back into full_name for database storage
      const fullName = `${profileData.first_name} ${profileData.last_name}`.trim();

      console.log('🔍 ProfilePopup - Saving profile with avatar:', {
        fullName,
        email: profileData.email,
        hasAvatar: !!profileData.avatar_url,
        avatarUrl: profileData.avatar_url
      });

      // First check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update({
            full_name: fullName,
            email: profileData.email,
            avatar_url: profileData.avatar_url // Preserve existing avatar URL
          })
          .eq('id', user.id);

        if (error) throw error;
        console.log('✅ ProfilePopup - Existing profile updated');
      } else {
        // Create new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            email: profileData.email,
            avatar_url: profileData.avatar_url,
            user_type: 'renter' // Default user type
          });

        if (error) throw error;
        console.log('✅ ProfilePopup - New profile created');
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file) => {
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileData(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }));

      console.log('🔍 ProfilePopup - Avatar uploaded, updating database:', {
        avatarUrl: data.publicUrl,
        userId: user.id
      });

      // Update profile with new avatar URL
      await supabase
        .from('user_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      console.log('✅ ProfilePopup - Avatar URL saved to database successfully');

      toast.success('Avatar updated successfully!');

      // Notify parent components to refresh avatar
      if (onAvatarUpdate) {
        console.log('🔄 ProfilePopup - Notifying parent components of avatar update');
        onAvatarUpdate(data.publicUrl);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Failed to upload avatar. Please try again.');
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="absolute top-16 right-4 sm:right-6 z-50"
        style={{
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 min-w-[320px] max-w-[400px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-4 ring-orange-100">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-2 hover:bg-orange-600 transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleAvatarUpload(file);
                  }}
                  className="hidden"
                />
              </div>

              {isEditing ? (
                <div className="w-full max-w-xs space-y-3">
                  <input
                    type="text"
                    value={profileData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    value={profileData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profileData.first_name || 'User'} {profileData.last_name || ''}
                  </h3>
                  <p className="text-sm text-gray-600">{profileData.email}</p>
                </div>
              )}
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{profileData.email}</p>
                </div>
              </div>

              {profileData.phone && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{profileData.phone}</p>
                  </div>
                </div>
              )}

              {profileData.location && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">{profileData.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Member Since</p>
                  <p className="text-sm text-gray-600">{profileData.join_date}</p>
                </div>
              </div>

              {profileData.bio && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Bio</p>
                  <p className="text-sm text-gray-600">{profileData.bio}</p>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="border-t pt-4 space-y-2">
              <button
                onClick={() => {
                  navigate('/settings');
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>

            {/* Edit/Save Buttons */}
            <div className="flex space-x-3 mt-6">
              {isEditing ? (
                <>
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfilePopup;
