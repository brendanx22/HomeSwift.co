// src/lib/propertyAPI.js
import { supabase, ensureSession } from "./supabaseClient";

// Ensure the API base URL includes the /api prefix
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.homeswift.co";

/**
 * Property Management API
 * Handles all property-related API calls
 */

export class PropertyAPI {
  /**
   * Get all properties (for browsing)
   */
  static async getAllProperties() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch properties");
      }

      return {
        success: true,
        properties: result.data || [],
      };
    } catch (error) {
      console.error("Error fetching properties:", error);
      return {
        success: false,
        properties: [],
        error: error.message,
      };
    }
  }

  /**
   * Get properties for a specific landlord
   */
  static async getMyProperties(landlordId) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", landlordId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, properties: data || [] };
    } catch (error) {
      console.error("Error fetching landlord properties:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single property by ID
   */
  static async getProperty(propertyId) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
          landlord:user_profiles!landlord_id (
            full_name,
            profile_image
          )
        `
        )
        .eq("id", propertyId)
        .single();

      if (error) throw error;

      console.log("🏠 Property data from DB:", {
        hasLandlordData: !!data.landlord,
        landlordName: data.landlord?.full_name,
        landlordImage: data.landlord?.profile_image,
      });

      // Flatten the landlord data
      const property = {
        ...data,
        landlord_name: data.landlord?.full_name || "Property Owner",
        landlord_profile_image: data.landlord?.profile_image || null,
      };

      // Remove the nested landlord object
      delete property.landlord;

      return { success: true, property };
    } catch (error) {
      console.error("Error fetching property:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new property
   */
  static async createProperty(propertyData) {
    try {
      // Ensure we have a valid session before making the request
      await ensureSession();
      
      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, property: data };
    } catch (error) {
      console.error("Error creating property:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a property
   */
  static async updateProperty(propertyId, updates) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", propertyId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, property: data };
    } catch (error) {
      console.error("Error updating property:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get saved properties for a user
   */
  static async getSavedProperties(userId) {
    const startTime = Date.now();
    try {
      console.log("🔍 [getSavedProperties] Starting fetch for user:", userId);

      // CRITICAL: Ensure Supabase session is loaded before making queries
      await ensureSession();
      console.log("✅ [Session] Supabase session ready");

      // Step 1: Get saved property IDs
      console.log("📋 [Step 1] Fetching saved property IDs...");
      const { data: savedData, error: savedError } = await supabase
        .from("saved_properties")
        .select("property_id, created_at")
        .eq("user_id", userId);

      console.log(`✅ [Step 1] Completed in ${Date.now() - startTime}ms`);

      if (savedError) {
        console.error("❌ [Step 1] Error:", savedError);
        console.error("❌ [Step 1] Error details:", {
          code: savedError.code,
          message: savedError.message,
          details: savedError.details,
          hint: savedError.hint,
        });
        throw savedError;
      }

      if (!savedData || savedData.length === 0) {
        console.log("ℹ️ [Step 1] No saved properties found");
        return { success: true, savedProperties: [] };
      }

      console.log(
        `📊 [Step 1] Found ${savedData.length} saved property IDs:`,
        savedData.map((s) => s.property_id)
      );

      // Step 2: Get property details
      const propertyIds = savedData.map((item) => item.property_id);
      console.log(
        "📋 [Step 2] Fetching property details for IDs:",
        propertyIds
      );

      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .in("id", propertyIds);

      console.log(`✅ [Step 2] Completed in ${Date.now() - startTime}ms`);

      if (propertiesError) {
        console.error("❌ [Step 2] Error:", propertiesError);
        throw propertiesError;
      }

      if (!properties || properties.length === 0) {
        console.warn(
          "⚠️ [Step 2] No properties found for saved IDs. This might indicate deleted properties or RLS issues."
        );
        return { success: true, savedProperties: [] };
      }

      console.log(
        `📊 [Step 2] Found ${properties.length} properties out of ${propertyIds.length} IDs`
      );

      // Step 3: Combine data
      console.log("📋 [Step 3] Combining saved properties with details...");
      const savedProperties = savedData
        .map((savedItem) => {
          const property = properties.find(
            (p) => p.id === savedItem.property_id
          );
          if (!property) {
            console.warn(
              `⚠️ Property ${savedItem.property_id} not found in results`
            );
          }
          return {
            ...savedItem,
            properties: property || null,
          };
        })
        .filter((item) => item.properties !== null);

      const totalTime = Date.now() - startTime;
      console.log(
        `✅ [Complete] Loaded ${savedProperties.length} saved properties in ${totalTime}ms`
      );

      return { success: true, savedProperties };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(
        `❌ [Error] getSavedProperties failed after ${totalTime}ms:`,
        error
      );
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      return {
        success: false,
        error: error.message || "Failed to load saved properties",
        details: error,
      };
    }
  }

  /**
   * Save/unsave a property for a user
   */
  static async toggleSaveProperty(userId, propertyId) {
    try {
      const { data: existing, error: checkError } = await supabase
        .from("saved_properties")
        .select("id")
        .eq("user_id", userId)
        .eq("property_id", propertyId);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from("saved_properties")
          .delete()
          .eq("user_id", userId)
          .eq("property_id", propertyId);

        if (error) throw error;
        return { success: true, action: "removed" };
      } else {
        const { error } = await supabase
          .from("saved_properties")
          .insert([{ user_id: userId, property_id: propertyId }]);

        if (error) throw error;
        return { success: true, action: "added" };
      }
    } catch (error) {
      console.error("Error toggling save property:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get property statistics for a landlord
   */
  static async getPropertyStats(landlordId) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, status, views, inquiries")
        .eq("landlord_id", landlordId);

      if (error) throw error;

      const stats = {
        totalProperties: data.length,
        activeProperties: data.filter((p) => p.status === "active").length,
        totalViews: data.reduce((sum, p) => sum + (p.views || 0), 0),
        totalInquiries: data.reduce((sum, p) => sum + (p.inquiries || 0), 0),
      };

      return { success: true, stats };
    } catch (error) {
      console.error("Error fetching property stats:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search properties with filters
   */
  static async searchProperties(searchParams) {
    try {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", "active");

      if (searchParams.query) {
        query = query.or(
          `title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%,location.ilike.%${searchParams.query}%`
        );
      }

      if (searchParams.location) {
        query = query.ilike("location", `%${searchParams.location}%`);
      }

      if (searchParams.propertyType) {
        query = query.eq("property_type", searchParams.propertyType);
      }

      if (searchParams.listingType) {
        query = query.eq("listing_type", searchParams.listingType);
      }

      if (searchParams.minPrice) {
        query = query.gte("price", searchParams.minPrice);
      }

      if (searchParams.maxPrice) {
        query = query.lte("price", searchParams.maxPrice);
      }

      if (searchParams.bedrooms) {
        query = query.gte("bedrooms", searchParams.bedrooms);
      }

      if (searchParams.bathrooms) {
        query = query.gte("bathrooms", searchParams.bathrooms);
      }

      if (searchParams.amenities && searchParams.amenities.length > 0) {
        query = query.contains("amenities", searchParams.amenities);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return { success: true, properties: data || [] };
    } catch (error) {
      console.error("Error searching properties:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment property views
   */
  static async incrementViews(propertyId) {
    try {
      const { data, error } = await supabase.rpc("increment_property_views", {
        property_id: propertyId,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error incrementing views:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment property inquiries
   */
  static async incrementInquiries(propertyId) {
    try {
      const { data, error } = await supabase.rpc(
        "increment_property_inquiries",
        {
          property_id: propertyId,
        }
      );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error incrementing inquiries:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get properties by location
   */
  static async getPropertiesByLocation(location) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .ilike("location", `%${location}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, properties: data || [] };
    } catch (error) {
      console.error("Error fetching properties by location:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get featured properties
   */
  static async getFeaturedProperties(limit = 10) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, properties: data || [] };
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get similar properties
   */
  static async getSimilarProperties(propertyId, limit = 6) {
    try {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("location, property_type, price")
        .eq("id", propertyId)
        .single();

      if (propertyError) throw propertyError;

      const priceRange = property.price * 0.3;

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .neq("id", propertyId)
        .or(
          `location.ilike.%${property.location}%,property_type.eq.${property.property_type}`
        )
        .gte("price", property.price - priceRange)
        .lte("price", property.price + priceRange)
        .limit(limit);

      if (error) throw error;

      return { success: true, properties: data || [] };
    } catch (error) {
      console.error("Error fetching similar properties:", error);
      return { success: false, error: error.message };
    }
  }
}
