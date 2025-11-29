import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Custom hook to manage real-time user data subscriptions
 * Subscribes to changes in saved properties and user profile
 * Automatically reconnects on connection loss
 * 
 * @param {string} userId - The current user's ID
 * @returns {Object} - { savedPropertiesCount, userProfile, loading, error, refetch }
 */
export const useRealtimeUserData = (userId) => {
    const [savedPropertiesCount, setSavedPropertiesCount] = useState(0);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to load initial data
    const loadInitialData = useCallback(async () => {
        if (!userId) {
            console.log('❌ No userId provided to useRealtimeUserData');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Loading initial data for userId:', userId);

            // Load saved properties count
            const { count, error: savedError } = await supabase
                .from('saved_properties')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (savedError) {
                console.error('❌ Error loading saved properties count:', savedError);
                throw savedError;
            }

            console.log('✅ Saved properties count loaded:', count);
            setSavedPropertiesCount(count || 0);

            // Load user profile
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('full_name, profile_image')
                .eq('id', userId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('❌ Error loading user profile:', profileError);
                // Don't throw - profile might not exist yet
            }

            if (profile) {
                console.log('✅ User profile loaded:', profile.full_name);
                setUserProfile(profile);
            }

            setLoading(false);
        } catch (err) {
            console.error('❌ Error loading initial user data:', err);
            setError(err);
            setLoading(false);
            // Don't rethrow - we want the hook to work even if initial load fails
        }
    }, [userId]);

    // Load initial data on mount or when userId changes
    useEffect(() => {
        console.log('🔄 loadInitialData effect triggered for userId:', userId);
        loadInitialData();
    }, [loadInitialData]);

    // Setup real-time subscriptions
    useEffect(() => {
        if (!userId) return;

        console.log('🔄 Setting up real-time subscriptions for user:', userId);

        // Subscribe to saved_properties changes
        const savedPropertiesChannel = supabase
            .channel(`saved-properties-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'saved_properties',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('📊 Saved properties change detected:', payload);

                    if (payload.eventType === 'INSERT') {
                        setSavedPropertiesCount(prev => prev + 1);
                    } else if (payload.eventType === 'DELETE') {
                        setSavedPropertiesCount(prev => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to saved properties changes');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to saved properties:', err);
                }
            });

        // Subscribe to user_profiles changes
        const profileChannel = supabase
            .channel(`profile-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_profiles',
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    console.log('👤 User profile change detected:', payload);
                    if (payload.new) {
                        setUserProfile({
                            full_name: payload.new.full_name,
                            profile_image: payload.new.profile_image
                        });
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to user profile changes');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Error subscribing to user profile:', err);
                }
            });

        // Cleanup function
        return () => {
            console.log('🧹 Cleaning up real-time subscriptions');
            supabase.removeChannel(savedPropertiesChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [userId]);

    return {
        savedPropertiesCount,
        userProfile,
        loading,
        error,
        refetch: loadInitialData
    };
};

export default useRealtimeUserData;
