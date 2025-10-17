const supabase = require('../utils/supabaseClient');

// Get all chats for current user
const getUserChats = async (req, res) => {
  try {
    const { user_id } = req.params;
    console.log("🟢 Fetching chats for user:", user_id);

    // Validate user_id
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user's chats using direct query (more reliable than RPC)
    const { data, error } = await supabase
      .from("chats")
      .select(`
        id,
        property_id,
        created_at,
        participants
      `)
      .contains("participants", [user_id]);

    if (error) {
      console.error('❌ Error fetching user chats:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('✅ No chats found for user');
      return res.json([]);
    }

    // Get the latest message for each chat
    const chatsWithMessages = await Promise.all(
      data.map(async (chat) => {
        const { data: messages, error: msgError } = await supabase
          .from("messages")
          .select("id, message, created_at, read, sender_id")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (msgError) {
          console.error('Error fetching messages for chat:', chat.id, msgError);
          return {
            chat_id: chat.id,
            property_id: chat.property_id,
            created_at: chat.created_at,
            last_message: null,
            last_message_time: chat.created_at,
            unread_count: 0
          };
        }

        const lastMessage = messages?.[0];
        const unreadCount = messages?.filter(m => !m.read && m.sender_id !== user_id).length || 0;

        return {
          chat_id: chat.id,
          property_id: chat.property_id,
          created_at: chat.created_at,
          last_message: lastMessage?.message || null,
          last_message_time: lastMessage?.created_at || chat.created_at,
          unread_count: unreadCount
        };
      })
    );

    console.log('✅ Successfully fetched chats:', chatsWithMessages.length, 'chats');
    res.json(chatsWithMessages);
  } catch (err) {
    console.error('❌ Error in getUserChats:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: "Failed to load chats",
      message: err.message,
      details: err.details || 'No additional details'
    });
  }
};

// Create or get existing chat
const startChat = async (req, res) => {
  try {
    const { userA, userB, property_id } = req.body;

    // Validate required fields
    if (!userA || !userB) {
      return res.status(400).json({ error: "Both user IDs are required" });
    }

    if (!property_id) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    // First, verify the property exists and get the landlord_id
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, landlord_id")
      .eq("id", property_id)
      .single();

    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return res.status(404).json({ error: "Property not found" });
      }
      throw propertyError;
    }

    // Ensure userB is actually the landlord of this property
    if (property.landlord_id !== userB) {
      return res.status(403).json({
        error: "UserB is not the landlord of this property"
      });
    }

    // Now check if chat already exists between renter (userA) and landlord (userB) for this property
    const { data: existingChats, error: checkError } = await supabase
      .from("chats")
      .select("id, participants")
      .eq("property_id", property_id)
      .contains("participants", [userA]);

    if (checkError) {
      console.error('Error checking existing chats:', checkError);
      throw checkError;
    }

    // Check if userB (landlord) is also a participant in any of these chats
    if (existingChats && existingChats.length > 0) {
      for (const chat of existingChats) {
        if (chat.participants.includes(userB)) {
          return res.json({
            chat_id: chat.id,
            existing: true,
            message: "Chat already exists between renter and landlord for this property"
          });
        }
      }
    }

    // Create new chat with participants array
    const participantsArray = [userA, userB];
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert([{ property_id, participants: participantsArray }])
      .select()
      .single();

    if (chatError) {
      console.error('Error creating chat:', chatError);
      throw chatError;
    }

    // Add participants to chat_participants table for backward compatibility
    const { error: participantsError } = await supabase
      .from("chat_participants")
      .insert([
        { chat_id: chat.id, user_id: userA },
        { chat_id: chat.id, user_id: userB },
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      // Don't throw here - chat is already created
    }

    res.json({
      chat_id: chat.id,
      property_id: chat.property_id,
      created_at: chat.created_at,
      new: true,
      message: "New chat created"
    });
  } catch (err) {
    console.error('Error in startChat:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get messages for a specific chat (with participant and property info)
const getMessages = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const currentUserId = req.user?.id; // Assuming you have user middleware

    if (!chat_id) {
      return res.status(400).json({ error: "Chat ID is required" });
    }

    // Get messages with sender profile info
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select(`
        id,
        chat_id,
        sender_id,
        message,
        read,
        created_at
      `)
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      throw msgError;
    }

    // Get chat details with property info
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select(`
        id,
        property_id,
        participants,
        properties!inner (
          id,
          title,
          landlord_id
        )
      `)
      .eq("id", chat_id)
      .single();

    if (chatError) {
      console.error('Error fetching chat:', chatError);
      // Continue without chat context if this fails
    }

    // Enhance messages with user profile data
    const messagesWithUserData = (messages || []).map(message => {
      // For now, use placeholder data - you can enhance this later
      return {
        ...message,
        user_profiles: {
          full_name: 'User', // Placeholder
          avatar_url: null
        }
      };
    });

    // Mark messages as read for current user (except their own messages)
    if (currentUserId) {
      const unreadMessages = messages?.filter(m => !m.read && m.sender_id !== currentUserId) || [];
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(m => m.id);
        await supabase
          .from("messages")
          .update({ read: true })
          .in("id", messageIds);
      }
    }

    // Include chat context in response
    const response = {
      messages: messagesWithUserData,
      chatContext: chat ? {
        property: chat.properties,
        participants: chat.participants,
        isLandlordChat: chat.properties?.landlord_id === currentUserId
      } : null
    };

    res.json(response);
  } catch (err) {
    console.error('Error in getMessages:', err);
    res.status(500).json({ error: err.message });
  }
};

// Send a message (with optional file attachments)
const sendMessage = async (req, res) => {
  try {
    // Handle both JSON and multipart form data
    let chat_id, sender_id, message;
    let attachments = [];

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Handle multipart form data (with file attachments)
      const formData = req.body;
      chat_id = formData.chat_id;
      sender_id = formData.sender_id;
      message = formData.message || '';
      attachments = req.files || [];
    } else {
      // Handle JSON data (text only)
      chat_id = req.body.chat_id;
      sender_id = req.body.sender_id;
      message = req.body.message || '';
    }

    // Validate required fields
    if (!chat_id || !sender_id || (!message.trim() && attachments.length === 0)) {
      return res.status(400).json({
        error: "Chat ID, sender ID, and message or attachments are required"
      });
    }

    // Verify user is participant in this chat using the participants array
    const { data: chat } = await supabase
      .from("chats")
      .select("participants")
      .eq("id", chat_id)
      .single();

    if (!chat || !chat.participants.includes(sender_id)) {
      return res.status(403).json({
        error: "User is not a participant in this chat"
      });
    }

    // Prepare message data
    const messageData = {
      chat_id,
      sender_id,
      message: message.trim()
    };

    // Insert the message
    const { data: insertedMessage, error } = await supabase
      .from("messages")
      .insert([messageData])
      .select(`
        id,
        chat_id,
        sender_id,
        message,
        read,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    // Handle file attachments if any
    if (attachments.length > 0) {
      const attachmentRecords = [];

      for (const file of attachments) {
        // Generate a unique filename
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFilename = `chat_${chat_id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

        // Upload file to Supabase Storage (you'll need to create a chat-attachments bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(uniqueFilename, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('Error uploading attachment:', uploadError);
          continue; // Skip this attachment but don't fail the whole message
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(uniqueFilename);

        // Create attachment record (you might want to add an attachments table)
        attachmentRecords.push({
          message_id: insertedMessage.id,
          filename: file.originalname,
          original_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          storage_path: uniqueFilename,
          public_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        });
      }

      // If you have an attachments table, insert the records here
      // For now, we'll just log them and include in response
      console.log('Attachments uploaded:', attachmentRecords.length);
    }

    // Add placeholder user profile data
    const messageWithUserData = {
      ...insertedMessage,
      user_profiles: {
        full_name: 'User',
        avatar_url: null
      },
      attachments: attachments.length > 0 ? attachments.map(file => ({
        filename: file.originalname,
        size: file.size,
        type: file.mimetype
      })) : []
    };

    res.json(messageWithUserData);
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const { user_id } = req.body;

    if (!chat_id || !user_id) {
      return res.status(400).json({
        error: "Chat ID and user ID are required"
      });
    }

    // Verify user is participant in this chat using the participants array
    const { data: chat } = await supabase
      .from("chats")
      .select("participants")
      .eq("id", chat_id)
      .single();

    if (!chat || !chat.participants.includes(user_id)) {
      return res.status(403).json({
        error: "User is not a participant in this chat"
      });
    }

    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("chat_id", chat_id)
      .neq("sender_id", user_id)
      .eq("read", false);

    if (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }

    res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    console.error('Error in markMessagesAsRead:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserChats,
  startChat,
  getMessages,
  sendMessage,
  markMessagesAsRead
};
