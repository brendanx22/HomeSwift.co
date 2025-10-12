const { validationResult } = require('express-validator');
const supabase = require('../utils/supabaseClient');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
exports.getAllProperties = async (req, res) => {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:user_profiles(id, full_name, email)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: properties });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ success: false, error: 'Error fetching properties' });
  }
};

// @desc    Get current user's properties
// @route   GET /api/properties/my
// @access  Private
exports.getMyProperties = async (req, res) => {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: properties });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({ success: false, error: 'Error fetching your properties' });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getPropertyById = async (req, res) => {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:user_profiles(id, full_name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      throw error;
    }

    // Increment view count
    await supabase
      .from('properties')
      .update({ views: (property.views || 0) + 1 })
      .eq('id', req.params.id);

    res.json({ success: true, data: property });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ success: false, error: 'Error fetching property' });
  }
};

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private
exports.createProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, price, location } = req.body;
  
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .insert([
        {
          user_id: req.user.userId,
          title,
          description,
          price: parseFloat(price),
          location,
          status: 'active',
          views: 0
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ success: false, error: 'Error creating property' });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private
exports.updateProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, price, location, status } = req.body;
  const updates = {};
  
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (price) updates.price = parseFloat(price);
  if (location) updates.location = location;
  if (status) updates.status = status;
  updates.updated_at = new Date().toISOString();

  try {
    // Check if property exists and belongs to user
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      throw fetchError;
    }

    if (existingProperty.user_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this property' 
      });
    }

    // Update property
    const { data: property, error: updateError } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, data: property });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ success: false, error: 'Error updating property' });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private
exports.deleteProperty = async (req, res) => {
  try {
    // Check if property exists and belongs to user
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      throw fetchError;
    }

    if (existingProperty.user_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to delete this property' 
      });
    }

    // Delete property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ success: false, error: 'Error deleting property' });
  }
};
