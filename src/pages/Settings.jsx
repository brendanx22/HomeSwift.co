import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Bell,
  Shield,
  CreditCard,
  Settings as SettingsIcon,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar_url: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    propertyAlerts: true,
    marketingEmails: false,
    language: 'en',
    currency: 'NGN'
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true
  });

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserData();
    }
  }, [isAuthenticated, user?.id]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load user profile from user_profiles table (correct schema)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to handle non-existent profiles

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      if (profile) {
        // Profile exists - handle full_name format
        const nameParts = profile.full_name ? profile.full_name.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        console.log('🔍 Settings - Loading profile from database:', {
          hasAvatar: !!profile.avatar_url,
          fullName: profile.full_name,
          email: profile.email
        });

        setProfileData({
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || ''
        });
      } else {
        // No profile exists, use user auth data
        const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';
        const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

        console.log('🔍 Settings - No profile found, using auth data:', {
          firstName,
          lastName,
          email: user.email
        });

        setProfileData({
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
          phone: '',
          bio: '',
          avatar_url: null,
          location: ''
        });
      }

      // Load user preferences (if table exists)
      try {
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (prefs) {
          setPreferences(prev => ({ ...prev, ...prefs }));
        }
      } catch (error) {
        // Preferences table might not exist yet, use defaults
        console.log('User preferences table not found, using defaults');
      }

      // Load security settings (if table exists)
      try {
        const { data: security } = await supabase
          .from('user_security_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (security) {
          setSecuritySettings(prev => ({ ...prev, ...security }));
        }
      } catch (error) {
        // Security settings table might not exist yet, use defaults
        console.log('Security settings table not found, using defaults');
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);

      // Combine first and last name back into full_name for database storage
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();

      console.log('🔍 Settings - Saving profile with avatar:', {
        fullName,
        email: profileData.email,
        hasAvatar: !!profileData.avatar_url,
        avatarUrl: profileData.avatar_url
      });

      // Check if profile exists, if not create it
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
            phone: profileData.phone,
            location: profileData.location,
            bio: profileData.bio,
            avatar_url: profileData.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
        console.log('✅ Settings - Existing profile updated');
      } else {
        // Create new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            email: profileData.email,
            phone: profileData.phone,
            location: profileData.location,
            bio: profileData.bio,
            avatar_url: profileData.avatar_url,
            user_type: 'renter' // Set user type as renter
          });

        if (error) throw error;
        console.log('✅ Settings - New profile created');
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceUpdate = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityUpdate = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          ...securitySettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Security settings updated successfully!');
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
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

      console.log('🔍 Settings - Avatar uploaded, updating database:', {
        avatarUrl: data.publicUrl,
        userId: user.id
      });

      // Update profile with new avatar URL
      await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString()
        });

      console.log('✅ Settings - Avatar URL saved to database successfully');

      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);

      // Delete user data
      await supabase.from('user_profiles').delete().eq('id', user.id);
      await supabase.from('saved_properties').delete().eq('user_id', user.id);
      await supabase.from('search_history').delete().eq('user_id', user.id);

      // Sign out user
      await supabase.auth.signOut();

      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access settings</p>
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
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Back to Chat</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
                  { id: 'security', label: 'Security', icon: Shield },
                  { id: 'billing', label: 'Billing', icon: CreditCard },
                  { id: 'notifications', label: 'Notifications', icon: Bell }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#FF6B35] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {profileData.avatar_url ? (
                          <img
                            src={profileData.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-[#FF6B35] text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition-colors">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {profileData.firstName} {profileData.lastName}
                      </h2>
                      <p className="text-gray-600">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        placeholder="Enter your location"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={saving}
                      className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications in browser' },
                        { key: 'propertyAlerts', label: 'Property Alerts', description: 'Get notified about new properties matching your criteria' },
                        { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional emails and updates' }
                      ].map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">{pref.label}</label>
                            <p className="text-sm text-gray-500">{pref.description}</p>
                          </div>
                          <button
                            onClick={() => setPreferences(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences[pref.key] ? 'bg-[#FF6B35]' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences[pref.key] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Display Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          value={preferences.language}
                          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                          value={preferences.currency}
                          onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                        >
                          <option value="NGN">Nigerian Naira (₦)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                        </select>
                      </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePreferenceUpdate}
                      disabled={saving}
                      className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Preferences</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <button
                          onClick={() => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            securitySettings.twoFactorEnabled ? 'bg-[#FF6B35]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Login Alerts</h4>
                          <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                        </div>
                        <button
                          onClick={() => setSecuritySettings(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            securitySettings.loginAlerts ? 'bg-[#FF6B35]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleSecurityUpdate}
                      disabled={saving}
                      className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Security Settings</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border-t pt-8 mt-8">
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                        <h4 className="font-medium text-red-900">Delete Account</h4>
                      </div>
                      <p className="text-red-700 mb-6">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Billing & Subscription</h3>
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Subscriptions</h4>
                      <p className="text-gray-600 mb-6">You don't have any active subscriptions at the moment.</p>
                      <button className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
                        View Plans
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.emailNotifications ? 'bg-[#FF6B35]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                      </div>
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.pushNotifications ? 'bg-[#FF6B35]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Property Alerts</h3>
                        <p className="text-sm text-gray-600">Get notified about new properties matching your criteria</p>
                      </div>
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, propertyAlerts: !prev.propertyAlerts }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.propertyAlerts ? 'bg-[#FF6B35]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.propertyAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Marketing Emails</h3>
                        <p className="text-sm text-gray-600">Receive promotional emails and updates</p>
                      </div>
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.marketingEmails ? 'bg-[#FF6B35]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handlePreferencesUpdate}
                      disabled={saving}
                      className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Preferences</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
