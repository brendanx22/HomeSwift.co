const { validationResult } = require('express-validator');
const supabase = require('../utils/supabaseClient');

// Enhanced logging
const log = (req, message, data = '') => {
  const timestamp = new Date().toISOString();
  const requestId = req.id || 'no-request-id';
  console.log(`[${timestamp}] [${requestId}] ${message}`, data || '');
};

const errorLog = (req, message, error) => {
  const timestamp = new Date().toISOString();
  const requestId = req.id || 'no-request-id';
  console.error(`[${timestamp}] [${requestId}] ERROR: ${message}`, error?.message || error);
  if (error?.stack) {
    console.error(error.stack);
  }
};

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
exports.getAllProperties = async (req, res) => {
  try {
    log(req, 'Fetching all active properties');
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    log(req, `Fetched ${properties.length} properties`);
    res.json({ success: true, data: properties });
  } catch (error) {
    errorLog(req, 'Get properties error:', error);
    res.status(500).json({ success: false, error: 'Error fetching properties' });
  }
};

// @desc    Get current user's properties
// @route   GET /api/properties/my
// @access  Private
exports.getMyProperties = async (req, res) => {
  try {
    log(req, `Fetching properties for user ${req.user.userId}`);
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    log(req, `Fetched ${properties.length} properties for user ${req.user.userId}`);
    res.json({ success: true, data: properties });
  } catch (error) {
    errorLog(req, 'Get my properties error:', error);
    res.status(500).json({ success: false, error: 'Error fetching your properties' });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    log(req, `Fetching property with ID: ${id}`);
    
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:user_profiles(id, full_name, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!property) {
      log(req, `Property not found: ${id}`);
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    log(req, `Successfully fetched property: ${id}`);
    res.json({ success: true, data: property });
  } catch (error) {
    errorLog(req, `Get property by ID error (${req.params.id}):`, error);
    res.status(500).json({ success: false, error: 'Error fetching property' });
  }
};

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private
exports.createProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errorLog(req, 'Validation errors:', errors.array());
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  try {
    const { 
      title, 
      description = '', 
      price, 
      location, 
      property_type = 'apartment',
      rooms = 1,
      bathrooms = 1,
      amenities = [],
      images = [],
      status = 'draft'
    } = req.body;

    // Required fields check
    if (!title || !price || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['title', 'price', 'location']
      });
    }

    log(req, 'Creating new property', { 
      title, 
      price, 
      property_type, 
      userId: req.user?.userId || 'unknown'
    });
    
    const propertyData = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      location: typeof location === 'object' 
        ? `${location.city}, ${location.state}, ${location.country}`
        : String(location),
      property_type,
      rooms: Math.max(1, Number(rooms) || 1),
      bathrooms: Math.max(1, Number(bathrooms) || 1),
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) ? images : [],
      status: ['active', 'inactive', 'draft'].includes(status) ? status : 'draft',
      user_id: req.user?.userId
    };

    log(req, 'Property data prepared:', propertyData);

    const { data: property, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (error) {
      errorLog(req, 'Database error creating property:', error);
      throw new Error('Failed to save property to database');
    }

    log(req, `Successfully created property: ${property.id}`);
    res.status(201).json({ 
      success: true, 
      data: property,
      message: 'Property created successfully'
    });
  } catch (error) {
    errorLog(req, 'Create property error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error creating property',
      code: 'PROPERTY_CREATION_ERROR'
    });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private
exports.updateProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errorLog(req, 'Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    log(req, `Updating property: ${id}`, { updates: req.body });

    // First, verify the property exists and belongs to the user
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingProperty) {
      log(req, `Property not found: ${id}`);
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    if (existingProperty.user_id !== req.user.userId) {
      log(req, `Unauthorized update attempt by user ${req.user.userId} on property ${id}`);
      return res.status(403).json({ success: false, error: 'Not authorized to update this property' });
    }

    const updates = {};
    const { title, description, price, location, property_type, rooms, bathrooms, amenities, images, status } = req.body;
    
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (price) updates.price = price;
    if (location) updates.location = location;
    if (property_type) updates.property_type = property_type;
    if (rooms) updates.rooms = rooms;
    if (bathrooms) updates.bathrooms = bathrooms;
    if (amenities) updates.amenities = amenities;
    if (images) updates.images = images;
    if (status) updates.status = status;

    log(req, `Applying updates to property ${id}:`, updates);

    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    log(req, `Successfully updated property: ${id}`);
    res.json({ success: true, data: updatedProperty });
  } catch (error) {
    errorLog(req, `Update property error (${req.params.id}):`, error);
    res.status(500).json({ success: false, error: 'Error updating property' });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    log(req, `Deleting property: ${id}`);

    // First, verify the property exists and belongs to the user
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!existingProperty) {
      log(req, `Property not found for deletion: ${id}`);
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    if (existingProperty.user_id !== req.user.userId) {
      log(req, `Unauthorized delete attempt by user ${req.user.userId} on property ${id}`);
      return res.status(403).json({ success: false, error: 'Not authorized to delete this property' });
    }

    // Soft delete by updating status
    log(req, `Soft deleting property: ${id}`);
    const { data: deletedProperty, error: deleteError } = await supabase
      .from('properties')
      .update({ status: 'deleted' })
      .eq('id', id)
      .select()
      .single();

    if (deleteError) throw deleteError;

    log(req, `Successfully deleted property: ${id}`);
    res.json({ success: true, data: deletedProperty });
  } catch (error) {
    errorLog(req, `Delete property error (${req.params.id}):`, error);
    res.status(500).json({ success: false, error: 'Error deleting property' });
  }
};
