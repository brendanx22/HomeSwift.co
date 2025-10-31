// src/lib/propertyAPI.js
import { supabase } from "./supabaseClient";

/**
 * Property Management API
 * Handles all property-related database operations
 */

export class PropertyAPI {
  /**
   * Get all properties (for browsing)
   */
  static async getAllProperties() {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        properties: data || [],
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
        .select("*")
        .eq("id", propertyId)
        .single();

      if (error) throw error;

      return { success: true, property: data };
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
   * Delete a property
   */
  static async deleteProperty(propertyId) {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error deleting property:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle property featured status
   */
  static async toggleFeatured(propertyId) {
    try {
      const { data: current, error: fetchError } = await supabase
        .from("properties")
        .select("is_featured")
        .eq("id", propertyId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("properties")
        .update({ is_featured: !current.is_featured })
        .eq("id", propertyId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, property: data };
    } catch (error) {
      console.error("Error toggling featured status:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get saved properties for a user
   */
  static async getSavedProperties(userId) {
    try {
      const { data: savedData, error: savedError } = await supabase
        .from("saved_properties")
        .select("property_id, created_at")
        .eq("user_id", userId);

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) {
        return { success: true, savedProperties: [] };
      }

      const propertyIds = savedData.map((item) => item.property_id);

      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .in("id", propertyIds);

      if (propertiesError) throw propertiesError;

      const savedProperties = savedData.map((saved) => ({
        property_id: saved.property_id,
        created_at: saved.created_at,
        properties:
          propertiesData.find((prop) => prop.id === saved.property_id) || null,
      }));

      return { success: true, savedProperties };
    } catch (error) {
      console.error("Error fetching saved properties:", error);
      return { success: false, error: error.message };
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
          `title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%,location.ilike.%${searchParams.query}%`,
        );
      }

      if (searchParams.location) {
        query = query.ilike("location", `%${searchParams.location}%`);
      }

      if (searchParams.propertyType) {
        query = query.eq("property_type", searchParams.propertyType);
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
        },
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
          `location.ilike.%${property.location}%,property_type.eq.${property.property_type}`,
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
