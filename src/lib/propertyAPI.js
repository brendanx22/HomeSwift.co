// src/lib/propertyAPI.js
import { supabase } from './supabaseClient';

/**
 * Property Management API
 * Handles all property-related database operations
 */

export class PropertyAPI {
  /**
   * Get all properties with optional filtering
   */
  static async getProperties(filters = {}) {
    try {
      let query = supabase
        .from('properties')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }

      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms);
      }

      if (filters.bathrooms) {
        query = query.gte('bathrooms', filters.bathrooms);
      }

      // Order by featured first, then by creation date
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Add default landlord fields for frontend compatibility
      const properties = (data || []).map(property => ({
        ...property,
        landlord_name: 'Landlord',
        landlord_profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      }));

      console.log('✅ getProperties query successful, found:', properties.length, 'properties');
      return { success: true, properties };
    } catch (error) {
      console.error('❌ Error in getProperties:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get properties for a specific landlord
   */
  static async getMyProperties(landlordId) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add default landlord fields for frontend compatibility
      const properties = (data || []).map(property => ({
        ...property,
        landlord_name: 'Landlord',
        landlord_profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      }));

      return { success: true, properties };
    } catch (error) {
      console.error('Error fetching my properties:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all properties (for browsing)
   */
  static async getAllProperties(filters = {}) {
    try {
      let query = supabase
        .from('properties')
        .select('*');

      // Apply filters if provided
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }

      // Note: Price range, bedrooms, bathrooms are handled client-side

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Add default landlord fields for frontend compatibility
      const properties = (data || []).map(property => ({
        ...property,
        landlord_name: 'Landlord',
        landlord_profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      }));

      console.log('✅ getAllProperties query successful, found:', properties.length, 'properties');
      return { success: true, properties };
    } catch (error) {
      console.error('❌ Error in getAllProperties:', error);
      return { success: false, error: error.message };
    }
  }
  static async getProperty(propertyId, currentUser = null) {
    try {
      console.log('🔍 Fetching property:', propertyId);

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        console.error('❌ Property fetch error:', propertyError);
        throw propertyError;
      }

      if (!propertyData) {
        console.error('❌ No property data found for ID:', propertyId);
        throw new Error('Property not found');
      }

      console.log('✅ Property data fetched:', {
        id: propertyData.id,
        title: propertyData.title,
        landlord_id: propertyData.landlord_id
      });

      // Fetch landlord information if landlord_id exists
      let landlordInfo = {
        landlord_name: 'Property Owner',
        landlord_profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      };

      if (propertyData.landlord_id) {
        console.log('🔍 Fetching landlord info for ID:', propertyData.landlord_id);

        try {
          // Check if user_profiles table exists first
          const { data: tableCheck, error: tableError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);

          if (tableError && tableError.code === '42P01') {
            // Table doesn't exist yet - use current user info if available
            console.log('ℹ️ user_profiles table does not exist yet, checking current user...');
            if (currentUser && currentUser.id === propertyData.landlord_id) {
              landlordInfo = {
                landlord_name: currentUser.user_metadata?.full_name ||
                             currentUser.user_metadata?.name ||
                             currentUser.email?.split('@')[0] ||
                             'Landlord',
                landlord_profile_image: currentUser.user_metadata?.avatar_url ||
                                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              };
              console.log('✅ Using current user info for landlord:', landlordInfo.landlord_name);
            }
          } else if (!tableError) {
            // Table exists, try to fetch landlord profile
            console.log('✅ user_profiles table exists, querying for landlord data...');
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('full_name, avatar_url, first_name, last_name')
              .eq('id', propertyData.landlord_id)
              .single();

            if (!profileError && profileData) {
              landlordInfo = {
                landlord_name: profileData.full_name ||
                             `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() ||
                             'Landlord',
                landlord_profile_image: profileData.avatar_url ||
                                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              };
              console.log('✅ Landlord profile fetched:', landlordInfo.landlord_name);
            } else {
              console.log('ℹ️ Landlord profile not found in user_profiles, checking current user...');
              // Try current user as fallback
              if (currentUser && currentUser.id === propertyData.landlord_id) {
                landlordInfo = {
                  landlord_name: currentUser.user_metadata?.full_name ||
                               currentUser.user_metadata?.name ||
                               currentUser.email?.split('@')[0] ||
                               'Landlord',
                  landlord_profile_image: currentUser.user_metadata?.avatar_url ||
                                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                };
                console.log('✅ Using current user info for landlord:', landlordInfo.landlord_name);
              } else {
                console.log('ℹ️ Current user is not the landlord, using default');
              }
            }
          } else {
            console.warn('⚠️ Error checking user_profiles table:', tableError.message);
          }
        } catch (landlordErr) {
          console.warn('⚠️ Error fetching landlord info, using defaults:', landlordErr.message);
        }
      } else {
        console.log('ℹ️ No landlord_id found, using default landlord info');
      }

      const property = {
        ...propertyData,
        ...landlordInfo
      };

      return { success: true, property };
    } catch (error) {
      console.error('❌ Error fetching property:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new property
   */
  static async createProperty(propertyData) {
    try {
      console.log('🔄 Creating property with data:', propertyData);

      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        console.error('❌ Property creation failed:', error);
        throw error;
      }

      console.log('✅ Property created successfully:', data);
      return { success: true, property: data };
    } catch (error) {
      console.error('❌ Error creating property:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a property
   */
  static async updateProperty(propertyId, updates) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, property: data };
    } catch (error) {
      console.error('Error updating property:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a property
   */
  static async deleteProperty(propertyId) {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting property:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle property featured status
   */
  static async toggleFeatured(propertyId) {
    try {
      // First get current featured status
      const { data: current, error: fetchError } = await supabase
        .from('properties')
        .select('is_featured')
        .eq('id', propertyId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the status
      const { data, error } = await supabase
        .from('properties')
        .update({ is_featured: !current.is_featured })
        .eq('id', propertyId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, property: data };
    } catch (error) {
      console.error('Error toggling featured status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get saved properties for a user
   */
  static async getSavedProperties(userId) {
    try {
      // First get the saved property IDs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_properties')
        .select('property_id, created_at')
        .eq('user_id', userId);

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) {
        return { success: true, savedProperties: [] };
      }

      // Get the property IDs
      const propertyIds = savedData.map(item => item.property_id);

      // Fetch the actual property details
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);

      if (propertiesError) throw propertiesError;

      // Fetch landlord information for each property
      const propertiesWithLandlordInfo = await Promise.all(
        (propertiesData || []).map(async (property) => {
          let landlordInfo = {
            landlord_name: 'Landlord',
            landlord_profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
          };

          if (property.landlord_id) {
            try {
              // Check if user_profiles table exists first
              const { data: tableCheck, error: tableError } = await supabase
                .from('user_profiles')
                .select('id')
                .limit(1);

              if (tableError && tableError.code === '42P01') {
                // Table doesn't exist - use default
                console.log('ℹ️ user_profiles table does not exist for saved properties');
              } else if (!tableError) {
                // Table exists, try to fetch landlord profile
                const { data: profileData, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('full_name, avatar_url, first_name, last_name')
                  .eq('id', property.landlord_id)
                  .single();

                if (!profileError && profileData) {
                  landlordInfo = {
                    landlord_name: profileData.full_name ||
                                 `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() ||
                                 'Landlord',
                    landlord_profile_image: profileData.avatar_url ||
                                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                  };
                }
              }
            } catch (landlordErr) {
              console.warn('⚠️ Error fetching landlord info for saved property:', landlordErr.message);
            }
          }

          return {
            ...property,
            ...landlordInfo
          };
        })
      );

      // Combine the data
      const savedProperties = savedData.map(saved => ({
        property_id: saved.property_id,
        created_at: saved.created_at,
        properties: propertiesWithLandlordInfo.find(prop => prop.id === saved.property_id) || null
      }));

      return { success: true, savedProperties };
    } catch (error) {
      console.error('Error fetching saved properties:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save/unsave a property for a user
   */
  static async toggleSaveProperty(userId, propertyId) {
    try {
      // Check if already saved
      const { data: existing, error: checkError } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId);

        if (error) throw error;
        return { success: true, action: 'removed' };
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_properties')
          .insert([{ user_id: userId, property_id: propertyId }]);

        if (error) throw error;
        return { success: true, action: 'added' };
      }
    } catch (error) {
      console.error('Error toggling save property:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get property statistics for a landlord
   */
  static async getPropertyStats(landlordId) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, status, views, inquiries')
        .eq('landlord_id', landlordId);

      if (error) throw error;

      const stats = {
        totalProperties: data.length,
        activeProperties: data.filter(p => p.status === 'active').length,
        totalViews: data.reduce((sum, p) => sum + (p.views || 0), 0),
        totalInquiries: data.reduce((sum, p) => sum + (p.inquiries || 0), 0)
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error fetching property stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search properties with advanced filters
   */
  static async searchProperties(searchParams) {
    try {
      let query = supabase
        .from('properties')
        .select('*');

      // Text search
      if (searchParams.query) {
        query = query.or(`title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%,location.ilike.%${searchParams.query}%`);
      }

      // Location search
      if (searchParams.location) {
        query = query.ilike('location', `%${searchParams.location}%`);
      }

      // Property type
      if (searchParams.propertyType) {
        query = query.eq('property_type', searchParams.propertyType);
      }

      // Price range
      if (searchParams.minPrice) {
        query = query.gte('price', searchParams.minPrice);
      }
      if (searchParams.maxPrice) {
        query = query.lte('price', searchParams.maxPrice);
      }

      // Bedrooms/Bathrooms
      if (searchParams.bedrooms) {
        query = query.gte('bedrooms', searchParams.bedrooms);
      }
      if (searchParams.bathrooms) {
        query = query.gte('bathrooms', searchParams.bathrooms);
      }

      // Amenities
      if (searchParams.amenities && searchParams.amenities.length > 0) {
        query = query.overlaps('amenities', searchParams.amenities);
      }

      // Pet friendly
      if (searchParams.petFriendly !== undefined) {
        query = query.eq('pet_friendly', searchParams.petFriendly);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch landlord information for each property
      const propertiesWithLandlordInfo = await Promise.all(
        (data || []).map(async (property) => {
          let landlordInfo = {
            landlord_name: 'Landlord',
            landlord_profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
          };

          if (property.landlord_id) {
            try {
              // Check if user_profiles table exists first
              const { data: tableCheck, error: tableError } = await supabase
                .from('user_profiles')
                .select('id')
                .limit(1);

              if (tableError && tableError.code === '42P01') {
                // Table doesn't exist - use default
                console.log('ℹ️ user_profiles table does not exist for search results');
              } else if (!tableError) {
                // Table exists, try to fetch landlord profile
                const { data: profileData, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('full_name, avatar_url, first_name, last_name')
                  .eq('id', property.landlord_id)
                  .single();

                if (!profileError && profileData) {
                  landlordInfo = {
                    landlord_name: profileData.full_name ||
                                 `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() ||
                                 'Landlord',
                    landlord_profile_image: profileData.avatar_url ||
                                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                  };
                }
              }
            } catch (landlordErr) {
              console.warn('⚠️ Error fetching landlord info for search result:', landlordErr.message);
            }
          }

          return {
            ...property,
            ...landlordInfo
          };
        })
      );

      return { success: true, properties: propertiesWithLandlordInfo };
    } catch (error) {
      console.error('Error searching properties:', error);
      return { success: false, error: error.message };
    }
  }
}
