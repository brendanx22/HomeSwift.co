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
  AlertTriangle,
  X
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
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/landlord/dashboard')}>
          <img src="/images/logo.png" alt="HomeSwift" className="h-8 w-auto object-contain" />
        </div>
        <button
          onClick={() => navigate('/landlord/dashboard')}
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
                { id: 'payouts', label: 'Payout details', icon: CreditCard },
                { id: 'security', label: 'Login & security', icon: Shield },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'help', label: 'Help & support', icon: HelpCircle },
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
                    value={`${profileData.first_name} ${profileData.last_name}`.trim() || 'Not set'}
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

                {/* Edit Modes for Profile */}
                {activeTab.startsWith('profile-edit') && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-900">
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
                            value={profileData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            className="bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-gray-900"
                            placeholder="First name"
                          />
                          <input
                            type="text"
                            value={profileData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            className="bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-gray-900"
                            placeholder="Last name"
                          />
                        </div>
                      )}

                      {activeTab === 'profile-edit-phone' && (
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-gray-900"
                          placeholder="Phone number"
                        />
                      )}

                      {activeTab === 'profile-edit-location' && (
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-gray-900"
                          placeholder="Location"
                        />
                      )}

                      {activeTab === 'profile-edit-bio' && (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={4}
                          className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none text-gray-900"
                          placeholder="Tell us about yourself..."
                        />
                      )}

                      <div className="flex space-x-3 pt-4 border-t border-gray-200 mt-6">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={saving}
                          className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
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

            {/* Payout Details Tab */}
            {activeTab === 'payouts' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payout details</h2>
                <p className="text-gray-500 mb-8">Manage your bank details to receive payments</p>

                <div className="divide-y divide-gray-100">
                  <SettingsRow 
                    label="Bank Name" 
                    value={payoutSettings.bank_name}
                    onAction={() => setActiveTab('payouts-edit')}
                  />
                  <SettingsRow 
                    label="Account Number" 
                    value={payoutSettings.account_number}
                    onAction={() => setActiveTab('payouts-edit')}
                  />
                  <SettingsRow 
                    label="Account Name" 
                    value={payoutSettings.account_name}
                    onAction={() => setActiveTab('payouts-edit')}
                  />
                </div>

                {activeTab === 'payouts-edit' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-900">Edit Payout Details</h3>
                      <button onClick={() => setActiveTab('payouts')} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <select
                          value={payoutSettings.bank_code}
                          onChange={(e) => {
                             const idx = e.target.selectedIndex;
                             const label = e.target.options[idx].text;
                             setPayoutSettings({...payoutSettings, bank_code: e.target.value, bank_name: label});
                          }}
                          className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-gray-900"
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

                      <input
                        type="text"
                        maxLength="10"
                        value={payoutSettings.account_number}
                        onChange={(e) => setPayoutSettings({...payoutSettings, account_number: e.target.value})}
                        className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-gray-900"
                        placeholder="Account Number (10 digits)"
                      />
                      <input
                        type="text"
                        value={payoutSettings.account_name}
                        onChange={(e) => setPayoutSettings({...payoutSettings, account_name: e.target.value})}
                        className="w-full bg-white px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black outline-none text-gray-900"
                        placeholder="Account Holder Name"
                      />

                      <div className="flex space-x-3 pt-4 border-t border-gray-200 mt-6">
                        <button
                          onClick={handleSavePayoutDetails}
                          disabled={loading}
                          className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Details'}
                        </button>
                        <button
                          onClick={() => setActiveTab('payouts')}
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

            {/* Help & Support Tab */}
            {activeTab === 'help' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Help & support</h2>
                <p className="text-gray-500 mb-8">Get the help you need</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex flex-col items-start p-6 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors text-left">
                    <HelpCircle className="mb-4 text-gray-900" size={32} strokeWidth={1.5} />
                    <span className="font-bold text-gray-900">Visit our Help Center</span>
                    <span className="text-sm text-gray-500 mt-1">Found answers and learn how HomeSwift works</span>
                  </button>
                  <button className="flex flex-col items-start p-6 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors text-left">
                    <Bell className="mb-4 text-gray-900" size={32} strokeWidth={1.5} />
                    <span className="font-bold text-gray-900">Contact Support</span>
                    <span className="text-sm text-gray-500 mt-1">Get in touch with our team for assistance</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandlordSettings;
