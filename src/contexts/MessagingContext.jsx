import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabaseClient';

const MessagingContext = createContext();

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export const MessagingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(new Map());
  const [selectedUser, setSelectedUser] = useState(null);

  const peerConnections = useRef(new Map());
  const localStream = useRef(null);
  const typingTimeout = useRef(null);

  // Get the current Supabase session token
  const getAuthToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting Supabase session:', error);
        return null;
      }
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

      // Load conversations
  const loadConversations = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available for API call');
        return;
      }

      // Force HTTPS to avoid mixed content errors
      const apiUrl = 'https://api.homeswift.co';
      const response = await fetch(`${apiUrl}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Enhance conversations with otherParticipant data from online users
        const enhancedConversations = data.map(conv => {
          if (conv.otherParticipant) {
            return conv; // Already has otherParticipant
          }

          // Try to find otherParticipant from online users or user data
          const otherUser = Array.from(onlineUsers.values()).find(u => u.id === conv.otherParticipantId);
          if (otherUser) {
            return {
              ...conv,
              otherParticipant: otherUser
            };
          }

          return conv;
        });

        setConversations(enhancedConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const initializeSocket = async () => {
      if (isAuthenticated && user) {
        const token = await getAuthToken();
        if (!token) {
          console.error('No auth token available for Socket.IO');
          return;
        }

        // Force HTTPS to avoid mixed content errors
        const apiUrl = 'https://api.homeswift.co';

        const newSocket = io(apiUrl, {
          auth: {
            token: token
          }
        });

        newSocket.on('connect', () => {
          console.log('Connected to messaging server');
          setIsConnected(true);

          // Join user's room
          newSocket.emit('join', user.id);

          // Mark user as online
          newSocket.emit('user_online', {
            id: user.id,
            email: user.email,
            full_name: user.full_name || user.email,
            user_type: user.user_type,
            avatar_url: user.avatar_url
          });
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from messaging server');
          setIsConnected(false);
        });

        newSocket.on('new_message', (data) => {
          console.log('New message received:', data);
          // Only add to messages if it's for the current active conversation
          // and not already in the messages array (to prevent duplicates)
          if (data.conversationId === activeConversation) {
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const messageExists = prev.some(msg => msg.id === data.message.id);
              if (!messageExists) {
                return [...prev, data.message];
              }
              return prev;
            });
          }
          // Update conversation last message regardless
          updateConversationLastMessage(data.conversationId, data.message);
        });

        newSocket.on('message_sent', (data) => {
          console.log('Message sent confirmation:', data);
        });

        newSocket.on('message_error', (data) => {
          console.error('Message error:', data.error);
        });

        // WebRTC events
        newSocket.on('webrtc_offer', async (data) => {
          console.log('Received WebRTC offer:', data);
          await handleWebRTCOffer(data);
        });

        newSocket.on('webrtc_answer', async (data) => {
          console.log('Received WebRTC answer:', data);
          await handleWebRTCAnswer(data);
        });

        newSocket.on('webrtc_ice_candidate', async (data) => {
          console.log('Received ICE candidate:', data);
          await handleWebRTCIceCandidate(data);
        });

        // Call events
        newSocket.on('incoming_call', (data) => {
          console.log('Incoming call:', data);
          // This will be handled by the useWebRTC hook
        });

        newSocket.on('call_initiated', (data) => {
          console.log('Call initiated:', data);
          // This will be handled by the useWebRTC hook
        });

        newSocket.on('call_response', (data) => {
          console.log('Call response:', data);
          // This will be handled by the useWebRTC hook
        });

        // Typing indicators
        newSocket.on('user_typing', (data) => {
          setIsTyping(prev => new Map(prev.set(data.userId, {
            userId: data.userId,
            conversationId: data.conversationId
          })));
        });

        newSocket.on('user_stopped_typing', (data) => {
          setIsTyping(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      }
    };

    initializeSocket();
  }, [isAuthenticated, user]);

  // WebRTC handlers
  const handleWebRTCOffer = async (data) => {
    const { from: senderId, offer, callType = 'video' } = data;

    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Set up data channel for messaging
      peerConnection.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        receiveChannel.onmessage = (event) => {
          console.log('Received message via WebRTC:', event.data);
          // Handle incoming WebRTC message
        };
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream:', event.streams[0]);
        // The remote stream will be handled by the useWebRTC hook
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer back via Socket.IO
      socket.emit('webrtc_answer', {
        targetUserId: senderId,
        answer,
        callType
      });

      // Store peer connection
      peerConnections.current.set(senderId, peerConnection);

      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_ice_candidate', {
            targetUserId: senderId,
            candidate: event.candidate,
            callType
          });
        }
      };

    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  };

  const handleWebRTCAnswer = async (data) => {
    const { from: senderId, answer, callType } = data;

    try {
      const peerConnection = peerConnections.current.get(senderId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

        // Set up remote stream handling
        peerConnection.ontrack = (event) => {
          console.log('Received remote stream:', event.streams[0]);
          // The remote stream will be handled by the useWebRTC hook
        };
      }
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  };

  const handleWebRTCIceCandidate = async (data) => {
    const { from: senderId, candidate, callType } = data;

    try {
      const peerConnection = peerConnections.current.get(senderId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  // WebRTC connection initiation
  const initiateWebRTCConnection = async (targetUserId, callType = 'video') => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Create data channel for messaging
      const sendChannel = peerConnection.createDataChannel('messaging');
      sendChannel.onopen = () => {
        console.log('WebRTC data channel opened');
      };

      sendChannel.onmessage = (event) => {
        console.log('Received message via WebRTC data channel:', event.data);
      };

      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_ice_candidate', {
            targetUserId,
            candidate: event.candidate,
            callType
          });
        }
      };

      // Handle incoming data channel
      peerConnection.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        receiveChannel.onmessage = (event) => {
          console.log('Received message via WebRTC:', event.data);
        };
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream:', event.streams[0]);
        // The remote stream will be handled by the useWebRTC hook
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Store peer connection
      peerConnections.current.set(targetUserId, peerConnection);

      // Send offer via Socket.IO with call type
      socket.emit('webrtc_offer', {
        targetUserId,
        offer,
        callType
      });

      console.log(`WebRTC ${callType} connection initiated with:`, targetUserId);
    } catch (error) {
      console.error('Error initiating WebRTC connection:', error);
      throw error;
    }
  };

  // Send message via WebRTC data channel
  const sendWebRTCMessage = (targetUserId, message) => {
    const peerConnection = peerConnections.current.get(targetUserId);
    if (peerConnection) {
      const sendChannel = peerConnection.createDataChannel ?
        peerConnection.createDataChannel('messaging') :
        Array.from(peerConnection.getTransceivers()).find(t => t.dataChannel)?.dataChannel;

      if (sendChannel && sendChannel.readyState === 'open') {
        sendChannel.send(JSON.stringify({
          type: 'message',
          content: message,
          timestamp: new Date().toISOString()
        }));
        return true;
      }
    }
    return false;
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available for API call');
        return;
      }

      // Force HTTPS to avoid mixed content errors
      const apiUrl = 'https://api.homeswift.co';
      const response = await fetch(`${apiUrl}/api/messages/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setActiveConversation(conversationId);

        // Find and set the other participant as selected user
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation && conversation.otherParticipant) {
          setSelectedUser(conversation.otherParticipant);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send a message
  const sendMessage = async (conversationId, content, messageType = 'text') => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available for API call');
        return;
      }

      // Force HTTPS to avoid mixed content errors
      const apiUrl = 'https://api.homeswift.co';
      const response = await fetch(`${apiUrl}/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, message_type: messageType })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        updateConversationLastMessage(conversationId, message);
        return message;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Create or get conversation
  const createConversation = async (receiverId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available for API call');
        return;
      }

      // Force HTTPS to avoid mixed content errors
      const apiUrl = 'https://api.homeswift.co';
      const response = await fetch(`${apiUrl}/api/messages/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiver_id: receiverId })
      });

      if (response.ok) {
        const conversation = await response.json();
        setConversations(prev => [conversation, ...prev]);

        // Find the receiver user data and set as selected user
        const receiverUser = Array.from(onlineUsers.values()).find(u => u.id === receiverId);
        if (receiverUser) {
          setSelectedUser(receiverUser);
        }

        return conversation;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Typing indicators
  const startTyping = (conversationId) => {
    if (socket) {
      socket.emit('typing_start', {
        receiverId: getOtherParticipant(conversationId),
        conversationId
      });

      // Auto-stop typing after 3 seconds
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      typingTimeout.current = setTimeout(() => {
        stopTyping(conversationId);
      }, 3000);
    }
  };

  const stopTyping = (conversationId) => {
    if (socket) {
      socket.emit('typing_stop', {
        receiverId: getOtherParticipant(conversationId),
        conversationId
      });
    }
  };

  // Helper functions
  const getOtherParticipant = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return null;

    return conversation.otherParticipant || null;
  };

  const updateConversationLastMessage = (conversationId, message) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              last_message: message.content,
              last_message_at: message.created_at
            }
          : conv
      )
    );
  };

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  const value = {
    // Socket and connection
    socket,
    isConnected,
    onlineUsers,

    // Conversations and messages
    conversations,
    activeConversation,
    messages,
    isTyping,
    selectedUser,

    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    startTyping,
    stopTyping,

    // Setters
    setActiveConversation,
    setSelectedUser,

    // WebRTC
    initiateWebRTCConnection,
    sendWebRTCMessage,
    peerConnections: peerConnections.current
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
