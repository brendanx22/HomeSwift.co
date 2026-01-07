import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  Save,
  Camera,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const LandlordSettings = () => {
  const { user, isAuthenticated, loading: authLoading, deleteAccount, API_URL } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: null,
    location: ''
  });

  const [payoutSettings, setPayoutSettings] = useState({
    bank_name: '',
    bank_code: '',
    account_number: '',
    account_name: ''
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/landlord/login');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

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
          console.error('Error loading profile:', profileError);
        }

        if (profileData) {
          // Profile exists in database - handle both full_name and first_name/last_name formats
          const nameParts = profileData.full_name ? profileData.full_name.split(' ') : ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          console.log('🔍 LandlordSettings - Loading profile from database:', {
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
          });
        } else {
          // No profile exists, use user auth data
          const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';
          const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

          console.log('🔍 LandlordSettings - No profile found, using auth data:', {
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
        });
      }
    };

    loadProfile();
  }, [user]);

  // Load preferences and security settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        // Load user preferences (if table exists)
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (prefs) {
          setPreferences(prev => ({ ...prev, ...prefs }));
        }

        // Load security settings (if table exists)
        const { data: security } = await supabase
          .from('user_security_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (security) {
          setSecuritySettings(prev => ({ ...prev, ...security }));
        }
      } catch (error) {
        // Tables might not exist yet, use defaults
        console.log('Settings tables not found, using defaults');
      }
    };

    loadSettings();
  }, [user]);

  // Load payout settings
  useEffect(() => {
    const loadPayoutSettings = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('bank_details, payout_recipient_code')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to prevent error if no profile
      
      if (data?.bank_details) {
        setPayoutSettings(prev => ({
          ...prev,
          ...data.bank_details
        }));
      }
    };
    loadPayoutSettings();
  }, [user]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
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
      setLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine first and last name back into full_name for database storage
      const fullName = `${profileData.first_name} ${profileData.last_name}`.trim();

      console.log('🔍 LandlordSettings - Saving profile with avatar:', {
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
            phone: profileData.phone,
            location: profileData.location,
            bio: profileData.bio,
            avatar_url: profileData.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
        console.log('✅ LandlordSettings - Existing profile updated');
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
            user_type: 'landlord' // Set user type as landlord
          });

        if (error) throw error;
        console.log('✅ LandlordSettings - New profile created');
      }

      toast.success('Profile updated successfully!');
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

      console.log('🔍 LandlordSettings - Avatar uploaded, updating database:', {
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

      console.log('✅ LandlordSettings - Avatar URL saved to database successfully');

      toast.success('Avatar updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Failed to upload avatar');
    }
  };

  // Handle preferences update
  const handlePreferencesUpdate = async () => {
    setLoading(true);

    try {
      // Save preferences to database
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Preferences updated successfully!');
    } catch (err) {
      console.error('Error updating preferences:', err);
      toast.error('Failed to update preferences');
    }
  };

  const handleSavePayoutDetails = async () => {
    setLoading(true);
    try {
      if (!payoutSettings.bank_code || !payoutSettings.account_number) {
        toast.error('Please enter bank and account number');
        return;
      }

      // Call backend to create recipient
      const response = await fetch(`${API_URL}/api/payments/create-recipient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          name: payoutSettings.account_name || `${profileData.first_name} ${profileData.last_name}`,
          account_number: payoutSettings.account_number,
          bank_code: payoutSettings.bank_code
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Payout details saved successfully!');
        // Update local state if needed (API should have updated DB)
      } else {
        throw new Error(data.message || 'Failed to save payout details');
      }

    } catch (error) {
      console.error('Error saving payout details:', error);
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle security settings update
  const handleSecurityUpdate = async () => {
    setLoading(true);

    try {
      // Save security settings to database
      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          ...securitySettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Security settings updated successfully!');
    } catch (err) {
      console.error('Error updating security settings:', err);
      toast.error('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/landlord/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {profileData.avatar_url ? (
                            <img
                              src={profileData.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1 cursor-pointer hover:bg-orange-600 transition-colors">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleAvatarUpload(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Profile Photo</h3>
                        <p className="text-sm text-gray-600">Upload a new profile picture</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.first_name || ''}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your first name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.last_name || ''}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your last name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profileData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
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
                      disabled={loading}
                      className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
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
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
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
                        <h3 className="font-medium text-gray-900">Login Alerts</h3>
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

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
                      <p className="text-sm text-gray-600 mb-4">Update your password to keep your account secure</p>
                      <button className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                        Change Password
                      </button>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Login Sessions</h3>
                      <p className="text-sm text-gray-600 mb-4">Manage your active login sessions</p>
                      <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                        View Sessions
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleSecurityUpdate}
                      disabled={loading}
                      className="flex items-center space-x-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
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
                        disabled={loading}
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
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Payout Settings</h2>
                  <div className="space-y-6">
                    <div className="border border-green-100 bg-green-50 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-green-900">Direct Deposit</h3>
                          <p className="text-sm text-green-700">
                            Connect your bank account to receive rent payments automatically.
                            Payments are processed securely via Paystack.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form className="space-y-4">
                       <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name
                        </label>
                        <select
                          value={payoutSettings.bank_code}
                          onChange={(e) => {
                             const idx = e.target.selectedIndex;
                             const label = e.target.options[idx].text;
                             setPayoutSettings({...payoutSettings, bank_code: e.target.value, bank_name: label});
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                        >
                          <option value="">Select your bank</option>
                          <option value="044">Access Bank</option>
                          <option value="058">Guaranty Trust Bank</option>
                          <option value="011">First Bank of Nigeria</option>
                          <option value="214">First City Monument Bank</option>
                          <option value="057">Zenith Bank</option>
                          <option value="033">United Bank for Africa</option>
                          <option value="232">Sterling Bank</option>
                          <option value="032">Union Bank of Nigeria</option>
                          <option value="035">Wema Bank</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          maxLength="10"
                          value={payoutSettings.account_number}
                          onChange={(e) => setPayoutSettings({...payoutSettings, account_number: e.target.value})}
                          placeholder="0123456789"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Name
                        </label>
                         <input
                          type="text"
                          value={payoutSettings.account_name}
                          onChange={(e) => setPayoutSettings({...payoutSettings, account_name: e.target.value})}
                          placeholder="Account Name (e.g. John Doe)"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                        />
                      </div>

                      <div className="pt-4">
                        <button 
                          type="button"
                          onClick={handleSavePayoutDetails}
                          disabled={loading}
                          className="w-full bg-[#FF6B35] text-white px-4 py-3 rounded-lg hover:bg-orange-600 font-medium transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Payout Details'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'help' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Help & Support</h2>
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Contact Support</h3>
                      <p className="text-sm text-gray-600 mb-4">Need help? Our support team is here to assist you.</p>
                      <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                        Contact Support
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Documentation</h3>
                      <p className="text-sm text-gray-600 mb-4">Browse our comprehensive documentation.</p>
                      <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                        View Docs
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Report Issue</h3>
                      <p className="text-sm text-gray-600 mb-4">Found a bug or have a suggestion? Let us know.</p>
                      <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                        Report Issue
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordSettings;
