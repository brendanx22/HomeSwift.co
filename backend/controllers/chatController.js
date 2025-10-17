const supabase = require('../utils/supabaseClient');

// Get all chats for current user
const getUserChats = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate user_id
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Use the helper function for better performance
    const { data, error } = await supabase.rpc('get_user_chats', {
      user_uuid: user_id
    });

    if (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error in getUserChats:', err);
    res.status(500).json({ error: err.message });
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
      .from("chat_participants")
      .select(`
        chat_id,
        chats!inner(property_id)
      `)
      .eq("user_id", userA)
      .eq("chats.property_id", property_id);

    if (checkError) {
      console.error('Error checking existing chats:', checkError);
      throw checkError;
    }

    // Check if userB (landlord) is also a participant in any of these chats
    if (existingChats && existingChats.length > 0) {
      for (const chatParticipant of existingChats) {
        const { data: participants } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chatParticipant.chat_id);

        const landlordParticipant = participants?.find(p => p.user_id === userB);

        if (landlordParticipant) {
          return res.json({
            chat_id: chatParticipant.chat_id,
            existing: true,
            message: "Chat already exists between renter and landlord for this property"
          });
        }
      }
    }

    // Create new chat
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert([{ property_id }])
      .select()
      .single();

    if (chatError) {
      console.error('Error creating chat:', chatError);
      throw chatError;
    }

    // Add both participants
    const { error: participantsError } = await supabase
      .from("chat_participants")
      .insert([
        { chat_id: chat.id, user_id: userA },
        { chat_id: chat.id, user_id: userB },
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      throw participantsError;
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

// Get messages for a chat
const getMessages = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!chat_id) {
      return res.status(400).json({ error: "Chat ID is required" });
    }

    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        chat_id,
        sender_id,
        message,
        read,
        created_at,
        user_profiles!sender_id(full_name, avatar_url)
      `)
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    // Mark messages as read for current user (except their own messages)
    const currentUserId = req.user?.id; // Assuming you have user middleware
    if (currentUserId) {
      const unreadMessages = data?.filter(m => !m.read && m.sender_id !== currentUserId) || [];
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(m => m.id);
        await supabase
          .from("messages")
          .update({ read: true })
          .in("id", messageIds);
      }
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error in getMessages:', err);
    res.status(500).json({ error: err.message });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chat_id, sender_id, message } = req.body;

    // Validate required fields
    if (!chat_id || !sender_id || !message?.trim()) {
      return res.status(400).json({
        error: "Chat ID, sender ID, and message are required"
      });
    }

    // Verify user is participant in this chat
    const { data: participant } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("chat_id", chat_id)
      .eq("user_id", sender_id)
      .single();

    if (!participant) {
      return res.status(403).json({
        error: "User is not a participant in this chat"
      });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([{
        chat_id,
        sender_id,
        message: message.trim()
      }])
      .select(`
        id,
        chat_id,
        sender_id,
        message,
        read,
        created_at,
        user_profiles!sender_id(full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    res.json(data);
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

    // Verify user is participant in this chat
    const { data: participant } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("chat_id", chat_id)
      .eq("user_id", user_id)
      .single();

    if (!participant) {
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
