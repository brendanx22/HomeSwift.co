import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Edit,
  Settings as SettingsIcon,
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Save,
  Upload,
  Heart,
  MessageSquare,
  Home as HomeIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const ProfilePopup = ({ isOpen, onClose, position = 'navbar', onAvatarUpdate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 right-4 sm:right-6 z-50"
            style={{
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[280px] overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Navigation Menu */}
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/saved');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <Heart className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Saved Properties</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/message-center');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <MessageSquare className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Messages</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/chat');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <HomeIcon className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Home</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Profile & Settings */}
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/profile');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <User className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/settings');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <SettingsIcon className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Settings</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Logout */}
              <div className="py-2">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <LogOut className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">Log out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfilePopup;
