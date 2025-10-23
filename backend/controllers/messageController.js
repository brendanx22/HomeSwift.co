const supabase = require('../utils/supabaseClient');
const { log, errorLog } = require('../utils/logger');

// Store active WebRTC connections and online users
const onlineUsers = new Map();
const activeConnections = new Map();

// Get all conversations for the current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get conversations where user is in the participants JSON
    const { data: conversations, error } = await req.supabase
      .from('conversations')
      .select(`
        id,
        participants,
        last_message,
        last_message_at,
        created_at
      `)
      .like('participants', `%${userId}%`)
      .order('created_at', { ascending: false });

    if (error) {
      errorLog('Error fetching conversations:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    // Get unread message counts and other participant info for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conversation) => {
        // Parse participants JSON string to find other participant
        let participants;
        try {
          participants = JSON.parse(conversation.participants);
        } catch (e) {
          participants = [];
        }
        const otherParticipantId = participants.find(id => id !== userId);

        // Get other participant details
        const { data: otherParticipant, error: participantError } = await req.supabase
          .from('user_profiles')
          .select('id, email, full_name, user_type, avatar_url')
          .eq('id', otherParticipantId)
          .single();

        if (participantError) {
          console.warn('Could not fetch participant details:', participantError);
        }

        const { count } = await req.supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', userId)
          .eq('is_read', false);

        return {
          ...conversation,
          otherParticipant: otherParticipant || { id: otherParticipantId, email: 'Unknown', full_name: 'Unknown User' },
          unreadCount: count || 0
        };
      })
    );

    res.json(conversationsWithCounts);
  } catch (error) {
    errorLog('Error in getConversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get messages for a specific conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this conversation using participants JSON
    const { data: conversation, error: convError } = await req.supabase
      .from('conversations')
      .select('id, participants')
      .eq('id', conversationId)
      .like('participants', `%${userId}%`)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const { data: messages, error } = await req.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      errorLog('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Mark messages as read (messages sent to current user)
    await req.supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    res.json(messages);
  } catch (error) {
    errorLog('Error in getMessages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, message_type = 'text' } = req.body;
    const userId = req.user.id;

    // Verify user is part of this conversation using participants JSON
    const { data: conversation, error: convError } = await req.supabase
      .from('conversations')
      .select('id, participants')
      .eq('id', conversationId)
      .like('participants', `%${userId}%`)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Parse participants JSON string to find the receiver
    let participants;
    try {
      participants = JSON.parse(conversation.participants);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid conversation participants format' });
    }
    const receiverId = participants.find(id => id !== userId);

    if (!receiverId) {
      return res.status(400).json({ error: 'Invalid conversation participants' });
    }

    // Insert message
    const { data: message, error } = await req.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      errorLog('Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update conversation last message
    await req.supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Emit real-time message to receiver via Socket.IO
    if (req.io) {
      req.io.to(receiverId).emit('new_message', {
        message,
        conversation: conversation
      });
    }

    res.status(201).json(message);
  } catch (error) {
    errorLog('Error in sendMessage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create or get existing conversation
const createConversation = async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const sender_id = req.user.id;

    if (sender_id === receiver_id) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Use the database function to get or create conversation
    const { data: conversationId, error } = await req.supabase
      .rpc('get_or_create_conversation', {
        user1_id: sender_id,
        user2_id: receiver_id
      });

    if (error) {
      errorLog('Error with get_or_create_conversation RPC:', error);
      return res.status(500).json({ error: 'Failed to create or find conversation' });
    }

    // Get the full conversation data
    const { data: conversation, error: fetchError } = await req.supabase
      .from('conversations')
      .select(`
        id,
        participants,
        created_at
      `)
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      errorLog('Error fetching conversation data:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch conversation data' });
    }

    // Parse participants JSON to get other participant details
    let participants;
    try {
      participants = JSON.parse(conversation.participants);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid conversation participants format' });
    }
    const otherParticipantId = participants.find(id => id !== sender_id);
    const { data: otherParticipant, error: participantError } = await req.supabase
      .from('user_profiles')
      .select('id, email, full_name, user_type, avatar_url')
      .eq('id', otherParticipantId)
      .single();

    if (participantError) {
      console.warn('Could not fetch participant details:', participantError);
    }

    const conversationResponse = {
      ...conversation,
      otherParticipant: otherParticipant || { id: otherParticipantId, email: 'Unknown', full_name: 'Unknown User' },
      unreadCount: 0
    };

    res.status(201).json(conversationResponse);
  } catch (error) {
    errorLog('Error in createConversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this conversation using participants JSON
    const { data: conversation, error: convError } = await req.supabase
      .from('conversations')
      .select('id, participants')
      .eq('id', conversationId)
      .like('participants', `%${userId}%`)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark all messages in this conversation as read (except those sent by the current user)
    const { error } = await req.supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      errorLog('Error marking messages as read:', error);
      return res.status(500).json({ error: 'Failed to mark messages as read' });
    }

    res.json({ success: true });
  } catch (error) {
    errorLog('Error in markAsRead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Verify user owns the message
    const { data: message, error: fetchError } = await req.supabase
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .eq('sender_id', userId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const { error } = await req.supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      errorLog('Error deleting message:', error);
      return res.status(500).json({ error: 'Failed to delete message' });
    }

    res.json({ success: true });
  } catch (error) {
    errorLog('Error in deleteMessage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// WebRTC Signaling Handlers
const handleWebRTCOffer = async (req, res) => {
  try {
    const { targetUserId, offer } = req.body;
    const senderId = req.user.id;

    // Store the offer for the target user
    if (!activeConnections.has(targetUserId)) {
      activeConnections.set(targetUserId, new Map());
    }

    const targetConnections = activeConnections.get(targetUserId);
    targetConnections.set(senderId, { offer, type: 'offer' });

    // Notify target user via Socket.IO
    if (req.io) {
      req.io.to(targetUserId).emit('webrtc_offer', {
        from: senderId,
        offer
      });
    }

    res.json({ success: true });
  } catch (error) {
    errorLog('Error handling WebRTC offer:', error);
    res.status(500).json({ error: 'Failed to handle WebRTC offer' });
  }
};

const handleWebRTCAnswer = async (req, res) => {
  try {
    const { targetUserId, answer } = req.body;
    const senderId = req.user.id;

    // Send answer to target user via Socket.IO
    if (req.io) {
      req.io.to(targetUserId).emit('webrtc_answer', {
        from: senderId,
        answer
      });
    }

    res.json({ success: true });
  } catch (error) {
    errorLog('Error handling WebRTC answer:', error);
    res.status(500).json({ error: 'Failed to handle WebRTC answer' });
  }
};

const handleWebRTCIceCandidate = async (req, res) => {
  try {
    const { targetUserId, candidate } = req.body;
    const senderId = req.user.id;

    // Forward ICE candidate to target user via Socket.IO
    if (req.io) {
      req.io.to(targetUserId).emit('webrtc_ice_candidate', {
        from: senderId,
        candidate
      });
    }

    res.json({ success: true });
  } catch (error) {
    errorLog('Error handling WebRTC ICE candidate:', error);
    res.status(500).json({ error: 'Failed to handle WebRTC ICE candidate' });
  }
};

// Get online users for WebRTC connections
const getOnlineUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all online users except current user
    const onlineUsersList = Array.from(onlineUsers.entries())
      .filter(([id]) => id !== userId)
      .map(([id, user]) => ({
        id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        avatar_url: user.avatar_url
      }));

    res.json(onlineUsersList);
  } catch (error) {
    errorLog('Error in getOnlineUsers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markAsRead,
  deleteMessage,
  handleWebRTCOffer,
  handleWebRTCAnswer,
  handleWebRTCIceCandidate,
  getOnlineUsers
};
