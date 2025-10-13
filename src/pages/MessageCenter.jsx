// src/pages/MessageCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Paperclip,
  Image,
  Smile,
  ArrowLeft,
  User,
  Clock,
  Check,
  CheckCheck,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MessagingAPI } from '../lib/messagingAPI';
import { useNavigate } from 'react-router-dom';

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile); // Show sidebar by default on desktop, hide on mobile
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load conversations for the current user
  const loadConversations = async () => {
    try {
      setLoading(true);

      const { success, conversations: conversationsData } = await MessagingAPI.getConversations(user.id);

      if (success) {
        setConversations(conversationsData);

        // Auto-select first conversation if none selected
        if (conversationsData.length > 0 && !activeConversation) {
          setActiveConversation(conversationsData[0]);
          loadMessages(conversationsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const { success, messages: messagesData } = await MessagingAPI.getMessages(conversationId, user.id);

      if (success) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      setSending(true);

      // Send inquiry through API
      const { success, inquiry } = await MessagingAPI.sendInquiry(
        activeConversation.id,
        user.id,
        newMessage.trim(),
        { email: user.email }
      );

      if (success) {
        // Add message to local state
        const messageData = {
          id: inquiry.id,
          content: newMessage.trim(),
          timestamp: new Date(),
          sender: 'current_user',
          status: 'sent'
        };

        setMessages(prev => [...prev, messageData]);
        setNewMessage('');

        // Refresh conversations to show the new message
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      )}

      <div className="flex h-screen md:h-auto">
        {/* Conversations Sidebar */}
        <div className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
                showSidebar ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-80 bg-white border-r border-gray-200 flex flex-col'
        } ${!isMobile ? 'hidden md:flex' : ''}`}>

          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isMobile ? 'Conversations' : 'Messages'}
              </h2>
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                    <Search className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setActiveConversation(conversation);
                    loadMessages(conversation.id);
                    // Mark as read
                    MessagingAPI.markConversationAsRead(conversation.id, user.id);
                    if (isMobile) setShowSidebar(false);
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      conversation.participant.role === 'landlord' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {conversation.participant.avatar || conversation.participant.name[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.property?.title || 'Property Inquiry'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          conversation.lastMessage.unread ? 'font-medium text-gray-900' : 'text-gray-600'
                        }`}>
                          {conversation.lastMessage.content}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No conversations yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && showSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${isMobile && !showSidebar ? 'w-full' : ''}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isMobile && (
                      <button
                        onClick={() => setShowSidebar(true)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg md:hidden"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      activeConversation.participant.role === 'landlord' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {activeConversation.participant.avatar}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {activeConversation.participant.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeConversation.participant.lastSeen}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'current_user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'current_user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        message.sender === 'current_user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.sender === 'current_user' && (
                          <div className="flex items-center">
                            {message.status === 'sending' && <Clock className="w-3 h-3" />}
                            {message.status === 'sent' && <Check className="w-3 h-3" />}
                            {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                            {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-200" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={1}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                      <Image className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isMobile ? 'Select a conversation' : 'No Conversation Selected'}
                </h3>
                <p className="text-gray-600">
                  {isMobile ? 'Tap the menu to choose a conversation' : 'Choose a conversation from the sidebar to start messaging'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
