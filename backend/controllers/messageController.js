const { validationResult } = require('express-validator');
const supabase = require('../utils/supabaseClient');

// @desc    Send a message/inquiry
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { property_id, message } = req.body;
  const sender_id = req.user.userId;

  try {
    // Get property to find the owner
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', property_id)
      .single();

    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      throw propertyError;
    }

    // Prevent sending message to yourself
    if (property.user_id === sender_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot send message to yourself' 
      });
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          property_id,
          sender_id,
          receiver_id: property.user_id,
          message,
          read: false
        }
      ])
      .select()
      .single();

    if (messageError) throw messageError;

    // In a real app, you might want to send a notification here
    // e.g., email notification or push notification

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Error sending message' });
  }
};

// @desc    Get all messages for a property (only property owner can access)
// @route   GET /api/messages/property/:propertyId
// @access  Private
exports.getPropertyMessages = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Verify the user is the owner of the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('user_id')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      throw propertyError;
    }

    if (property.user_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to view these messages' 
      });
    }

    // Get all messages for this property
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!messages_sender_id_fkey(id, full_name, email)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('property_id', propertyId)
      .eq('receiver_id', req.user.userId)
      .eq('read', false);

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get property messages error:', error);
    res.status(500).json({ success: false, error: 'Error fetching messages' });
  }
};

// @desc    Get conversation between current user and another user
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user.userId;

    // Get messages where:
    // - current user is the sender and other user is the receiver
    // OR
    // - current user is the receiver and other user is the sender
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        property:properties(id, title),
        sender:user_profiles!messages_sender_id_fkey(id, full_name, email)
      `)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark received messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', otherUserId)
      .eq('read', false);

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, error: 'Error fetching conversation' });
  }
};

// @desc    Mark a message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Verify the message exists and is for the current user
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('receiver_id')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }
      throw fetchError;
    }

    if (message.receiver_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this message' 
      });
    }

    // Mark as read
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Error updating message status' });
  }
};
