import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook for real-time message listening
 * @param {string} chatId - The chat ID to listen to
 * @param {function} onNewMessage - Callback function when new message arrives
 * @returns {object} - Returns loading state and any errors
 */
export default function useRealtimeMessages(chatId, onNewMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chatId) {
      setIsConnected(false);
      return;
    }

    console.log('🔌 Setting up real-time listener for chat:', chatId);

    const channel = supabase
      .channel(`realtime:chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('📨 New message received:', payload.new);
          if (onNewMessage && typeof onNewMessage === 'function') {
            onNewMessage(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('📝 Message updated:', payload.new);
          // Handle message updates (like read status changes)
          if (onNewMessage && typeof onNewMessage === 'function') {
            onNewMessage(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(`Real-time connection error: ${status}`);
          setIsConnected(false);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    return () => {
      console.log('🔌 Cleaning up real-time listener for chat:', chatId);
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [chatId, onNewMessage]);

  return {
    isConnected,
    error
  };
}

/**
 * Hook for managing chat state and real-time updates
 * @param {string} chatId - The chat ID to manage
 * @param {object} currentUser - Current authenticated user object
 * @returns {object} - Returns messages, loading state, and helper functions
 */
export function useChat(chatId, currentUser) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatContext, setChatContext] = useState(null);

  // Real-time listener for new messages
  useRealtimeMessages(chatId, (newMessage) => {
    setMessages(prev => {
      // Avoid duplicates
      const exists = prev.find(m => m.id === newMessage.id);
      if (exists) return prev;
      return [...prev, newMessage];
    });
  });

  // Load messages when chat ID changes
  useEffect(() => {
    if (!chatId || !currentUser) return;

    loadMessages();
  }, [chatId, currentUser]);

  const loadMessages = async () => {
    if (!chatId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/${chatId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.access_token || localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      const data = await response.json();

      // Handle both old format (just messages array) and new format (with chatContext)
      if (Array.isArray(data)) {
        // Old format - just messages
        setMessages(data || []);
      } else {
        // New format - messages + chatContext
        setMessages(data.messages || []);
        setChatContext(data.chatContext || null);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText, attachments = []) => {
    if (!chatId || !currentUser || (!messageText.trim() && attachments.length === 0)) return;

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('sender_id', currentUser.id);
      formData.append('message', messageText.trim());

      // Add attachments if any
      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.access_token || localStorage.getItem('supabase.auth.token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to send message: ${response.status}`);
      }

      const newMessage = await response.json();

      // Optimistically add the message to the UI immediately
      // This ensures the message appears instantly for the sender
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.find(m => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });

      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const markAsRead = async () => {
    if (!chatId || !currentUser) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/${chatId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.access_token || localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          user_id: currentUser.id
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to mark as read: ${response.status}`);
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    chatContext,
    sendMessage,
    markAsRead,
    refetch: loadMessages
  };
}
