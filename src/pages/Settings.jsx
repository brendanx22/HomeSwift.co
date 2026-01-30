import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Settings as SettingsIcon,
  Camera,
  Save,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, deleteAccount } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar_url: null
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    propertyAlerts: true,
    marketingEmails: false,
    language: 'en',
    currency: 'NGN'
  });

  // Security state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true
  });

  // Load user data on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserData();
    }
  }, [isAuthenticated, user?.id]);

  // Load all user data from database
  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      if (profile) {
        // Parse full name into first and last name
        const nameParts = profile.full_name ? profile.full_name.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setProfileData({
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || null
        });
      } else {
        // No profile exists, use auth data
        const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';
        const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

        setProfileData({
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
          phone: '',
          location: '',
          bio: '',
          avatar_url: null
        });
      }

      // Load user preferences
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
        console.log('User preferences table not found, using defaults');
      }

      // Load security settings
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
        console.log('Security settings table not found, using defaults');
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile updates
  const handleProfileUpdate = async () => {
    try {
      setSaving(true);

      // Combine first and last name for database storage
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();

      // Check if profile exists, create or update accordingly
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
            user_type: 'renter'
          });

        if (error) throw error;
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle preferences updates
  const handlePreferencesUpdate = async () => {
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

  // Handle security settings updates
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

  // Handle avatar upload
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

      // Update profile with new avatar URL
      await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString()
        });

      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      
      const { success, error } = await deleteAccount();
      
      if (!success) {
        throw new Error(error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  // Show login prompt if not authenticated
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

  // Show loading spinner while loading data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35]"></div>
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
      {/* Airbnb Style Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-50 pt-safe">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <img src="/images/logo.png" alt="HomeSwift" className="h-8 w-auto object-contain" />
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="px-4 py-2 rounded-lg font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
        >
          Done
        </button>
      </header>

      <main className="settings-container">
        <div className="settings-grid">
          {/* Sidebar Navigation */}
          <aside className="settings-sidebar">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Account settings</h1>
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Personal information', icon: User },
                { id: 'security', label: 'Login & security', icon: Shield },
                { id: 'preferences', label: 'Privacy & sharing', icon: SettingsIcon },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'billing', label: 'Payments & payouts', icon: CreditCard },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-gray-50 shadow-sm'
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === item.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    <item.icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className={`text-base ${activeTab === item.id ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="settings-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal information</h2>
                <p className="text-gray-500 mb-8">Manage your profile details and how we can reach you</p>

                <div className="divide-y divide-gray-100">
                  <SettingsRow 
                    label="Legal name" 
                    value={`${profileData.firstName} ${profileData.lastName}`.trim() || 'Not set'}
                    onAction={() => setActiveTab('profile-edit-name')}
                  />
                  <SettingsRow 
                    label="Email address" 
                    value={profileData.email}
                    actionLabel="Edit"
                    onAction={() => toast.error('Email cannot be changed directly')}
                  />
                  <SettingsRow 
                    label="Phone numbers" 
                    value={profileData.phone}
                    onAction={() => setActiveTab('profile-edit-phone')}
                  />
                  <SettingsRow 
                    label="Location" 
                    value={profileData.location}
                    onAction={() => setActiveTab('profile-edit-location')}
                  />
                  <SettingsRow 
                    label="Bio" 
                    value={profileData.bio}
                    onAction={() => setActiveTab('profile-edit-bio')}
                  />
                </div>

                {/* Edit Modes */}
                {(activeTab.startsWith('profile-edit')) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">
                        {activeTab === 'profile-edit-name' && 'Edit Name'}
                        {activeTab === 'profile-edit-phone' && 'Edit Phone Number'}
                        {activeTab === 'profile-edit-location' && 'Edit Location'}
                        {activeTab === 'profile-edit-bio' && 'Edit Bio'}
                      </h3>
                      <button onClick={() => setActiveTab('profile')} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {activeTab === 'profile-edit-name' && (
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            placeholder="First name"
                          />
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            placeholder="Last name"
                          />
                        </div>
                      )}

                      {activeTab === 'profile-edit-phone' && (
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                          placeholder="Phone number"
                        />
                      )}

                      {activeTab === 'profile-edit-location' && (
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                          placeholder="Location"
                        />
                      )}

                      {activeTab === 'profile-edit-bio' && (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          rows={4}
                          className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      )}

                      <div className="flex space-x-3 pt-4 border-t border-gray-200 mt-6">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={saving}
                          className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="flex-1 bg-white border border-gray-300 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Login & security</h2>
                <p className="text-gray-500 mb-8">Update your password and secure your account</p>

                <div className="divide-y divide-gray-100">
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-label">Two-Factor Authentication</div>
                      <div className="settings-value">
                        {securitySettings.twoFactorEnabled ? 'On' : 'Off'}
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
                        setTimeout(handleSecurityUpdate, 0);
                      }}
                      className="settings-action"
                    >
                      {securitySettings.twoFactorEnabled ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-label">Login Alerts</div>
                      <div className="settings-value">
                        {securitySettings.loginAlerts ? 'On' : 'Off'}
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        setSecuritySettings(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }));
                        setTimeout(handleSecurityUpdate, 0);
                      }}
                      className="settings-action"
                    >
                      {securitySettings.loginAlerts ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  <div className="py-8">
                    <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
                    <div className="p-6 border border-red-100 bg-red-50 rounded-2xl">
                      <p className="text-red-700 mb-6 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
                      <button
                        onClick={handleDeleteAccount}
                        className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy & sharing</h2>
                <p className="text-gray-500 mb-8">Manage your data and privacy settings</p>

                <div className="divide-y divide-gray-100">
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-label">Language</div>
                      <div className="settings-value">
                        {preferences.language === 'en' ? 'English' : preferences.language}
                      </div>
                    </div>
                    <button className="settings-action">Change</button>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-label">Currency</div>
                      <div className="settings-value">
                        {preferences.currency}
                      </div>
                    </div>
                    <button className="settings-action">Change</button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
                <p className="text-gray-500 mb-8">Choose which notifications you receive and how</p>

                <div className="divide-y divide-gray-100">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications' },
                    { key: 'pushNotifications', label: 'Push Notifications' },
                    { key: 'propertyAlerts', label: 'Property Alerts' },
                  ].map((pref) => (
                    <div className="settings-row" key={pref.key}>
                      <div className="settings-row-info">
                        <div className="settings-label">{pref.label}</div>
                        <div className="settings-value">
                          {preferences[pref.key] ? 'On' : 'Off'}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setPreferences(prev => ({ ...prev, [pref.key]: !prev[pref.key] }));
                          setTimeout(handlePreferencesUpdate, 0);
                        }}
                        className="settings-action"
                      >
                        {preferences[pref.key] ? 'Turn off' : 'Turn on'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payments & payouts</h2>
                <p className="text-gray-500 mb-8">Review payments, payouts, coupons, and gift cards</p>

                <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                  <CreditCard className="mx-auto text-gray-300 mb-4" size={48} strokeWidth={1} />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No payment methods</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Add a payment method to start booking properties on HomeSwift.</p>
                  <button className="mt-6 px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                    Add payment method
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

