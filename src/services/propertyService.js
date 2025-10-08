import { supabase } from '../lib/supabaseClient';

// Validate property data before saving
const validateProperty = (property) => {
  const errors = [];
  
  if (!property.title || property.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!property.location || property.location.trim() === '') {
    errors.push('Location is required');
  }
  
  if (!property.price || isNaN(property.price) || property.price <= 0) {
    errors.push('Valid price is required');
  }
  
  if (property.bedrooms && (isNaN(property.bedrooms) || property.bedrooms < 0)) {
    errors.push('Number of bedrooms must be a positive number');
  }
  
  if (property.bathrooms && (isNaN(property.bathrooms) || property.bathrooms <= 0)) {
    errors.push('Number of bathrooms must be greater than 0');
  }
  
  if (property.area && (isNaN(property.area) || property.area <= 0)) {
    errors.push('Area must be a positive number');
  }
  
  return errors;
};

// Upload image to Supabase Storage
const uploadImage = async (file, propertyId) => {
  if (!file) return { data: null, error: 'No file provided' };
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${propertyId}-${Date.now()}.${fileExt}`;
  const filePath = `${propertyId}/${fileName}`;
  
  try {
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);
      
    return { data: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { data: null, error: error.message };
  }
};

export const createProperty = async (propertyData, imageFile) => {
  // Validate property data
  const validationErrors = validateProperty(propertyData);
  if (validationErrors.length > 0) {
    return { data: null, error: validationErrors.join(', ') };
  }
  
  try {
    // First create the property
    const { data: property, error: createError } = await supabase
      .from('properties')
      .insert([{
        ...propertyData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    
    // If there's an image, upload it
    if (imageFile) {
      const { data: imageUrl, error: uploadError } = await uploadImage(imageFile, property.id);
      
      if (uploadError) {
        console.error('Image upload failed, but property was created:', uploadError);
      } else if (imageUrl) {
        // Update property with image URL
        const { error: updateError } = await supabase
          .from('properties')
          .update({ image_url: imageUrl })
          .eq('id', property.id);
          
        if (updateError) {
          console.error('Failed to update property with image URL:', updateError);
        } else {
          property.image_url = imageUrl;
        }
      }
    }
    
    return { data: property, error: null };
  } catch (error) {
    console.error('Error creating property:', error);
    return { data: null, error: error.message || 'Failed to create property' };
  }
};

export const getProperties = async (filters = {}) => {
  try {
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (filters.minPrice) {
      query = query.gte('price', parseFloat(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      query = query.lte('price', parseFloat(filters.maxPrice));
    }
    
    if (filters.bedrooms) {
      query = query.eq('bedrooms', parseInt(filters.bedrooms, 10));
    }
    
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching properties:', error);
    return { data: [], error: error.message || 'Failed to fetch properties' };
  }
};

export const getLandlordProperties = async (landlordId) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching landlord properties:', error);
    return { data: [], error: error.message || 'Failed to fetch properties' };
  }
};

export const getPropertyById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching property:', error);
    return { data: null, error: error.message || 'Failed to fetch property' };
  }
};

export const updateProperty = async (id, updates, imageFile = null) => {
  // Validate updates if they include property data
  if (Object.keys(updates).length > 0) {
    const validationErrors = validateProperty(updates);
    if (validationErrors.length > 0) {
      return { data: null, error: validationErrors.join(', ') };
    }
  }
  
  try {
    // If there's a new image, upload it first
    if (imageFile) {
      const { data: imageUrl, error: uploadError } = await uploadImage(imageFile, id);
      
      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        return { data: null, error: uploadError };
      }
      
      // Add image URL to updates
      updates.image_url = imageUrl;
    }
    
    // Only proceed with update if there are updates to make
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('properties')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return { data, error: null };
    }
    
    // If no updates were made but we have the property, return it
    const { data: property } = await getPropertyById(id);
    return { data: property, error: null };
  } catch (error) {
    console.error('Error updating property:', error);
    return { data: null, error: error.message || 'Failed to update property' };
  }
};

export const deleteProperty = async (id) => {
  try {
    // First, delete any associated images
    const { data: files, error: listError } = await supabase.storage
      .from('property-images')
      .list(id + '/');
    
    if (listError) {
      console.error('Error listing property images:', listError);
    } else if (files && files.length > 0) {
      const filePaths = files.map(file => `${id}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('property-images')
        .remove(filePaths);
        
      if (deleteError) {
        console.error('Error deleting property images:', deleteError);
      }
    }
    
    // Then delete the property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { error: error.message || 'Failed to delete property' };
  }
};
