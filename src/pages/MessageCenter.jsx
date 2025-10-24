import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Users,
  Smile,
  Paperclip,
  Image,
  X,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoCallModal from '../components/VideoCallModal';
import VoiceCallModal from '../components/VoiceCallModal';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';

const MessageCenter = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    isTyping,
    selectedUser,
    loadMessages,
    sendMessage,
    createConversation,
    startTyping,
    stopTyping,
    initiateWebRTCConnection,
    setActiveConversation,
    setSelectedUser
  } = useMessaging();

  // WebRTC hook for handling incoming calls
  const { incomingCall } = useWebRTC(null);

  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-open modal when incoming call is received
  useEffect(() => {
    if (incomingCall) {
      if (incomingCall.callType === 'video') {
        setShowVideoCall(true);
      } else if (incomingCall.callType === 'voice') {
        setShowVoiceCall(true);
      }
    }
  }, [incomingCall]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    // Clear the input immediately for better UX
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Send message via context (which uses HTTP API)
    await sendMessage(activeConversation, messageContent);

    // Stop typing indicator
    stopTyping(activeConversation);
  };

  // Handle starting a conversation
  const handleStartConversation = async (otherUser) => {
    const existingConversation = conversations.find(conv =>
      conv.otherParticipant?.id === otherUser.id
    );

    if (existingConversation) {
      console.log('Opening existing conversation:', existingConversation.id, 'with user:', otherUser);
      setActiveConversation(existingConversation.id);
      setSelectedUser(otherUser);
      await loadMessages(existingConversation.id);
    } else {
      console.log('Creating new conversation with user:', otherUser);
      const newConv = await createConversation(otherUser.id);
      if (newConv) {
        console.log('New conversation created:', newConv.id);
        setActiveConversation(newConv.id);
        setSelectedUser(otherUser);
        await loadMessages(newConv.id);
      }
    }
    setShowUserSearch(false);
  };

  // Handle WebRTC call
  const handleWebRTCCall = async (targetUserId) => {
    setShowVideoCall(true);
  };

  // Handle voice call
  const handleVoiceCall = async (targetUserId) => {
    setShowVoiceCall(true);
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const otherUser = conv.otherParticipant;
    return otherUser?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherUser?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header - Static */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            <span className="bg-[#FF6B35] text-white text-xs px-2 py-1 rounded-full">
              {conversations.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {showMobileNav && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent bg-gray-50"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Header - Only on desktop */}
      <div className="hidden md:block bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-76px)]">
        {/* Conversations Sidebar - Always visible on mobile */}
        <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const otherUser = conversation.otherParticipant;
                  const isOnline = onlineUsers.has(otherUser?.id);
                  const isUserTyping = isTyping.has(otherUser?.id);

                  return (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => {
                        setActiveConversation(conversation.id);
                        setSelectedUser(otherUser);
                        loadMessages(conversation.id);
                        setShowMobileNav(false);
                      }}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-[#FF6B35]/5 hover:to-transparent transition-all duration-200 ${
                        activeConversation === conversation.id
                          ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/5 border-r-2 border-r-[#FF6B35]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                            {otherUser?.avatar_url ? (
                              <img
                                src={otherUser.avatar_url}
                                alt={otherUser?.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-semibold text-gray-600">
                                {(otherUser?.full_name || otherUser?.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                              {otherUser?.full_name || otherUser?.email}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {conversation.last_message_at ?
                                new Date(conversation.last_message_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''
                              }
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {isUserTyping ? (
                                <span className="text-[#FF6B35] italic flex items-center">
                                  <span className="animate-pulse">●</span>
                                  <span className="animate-pulse delay-100">●</span>
                                  <span className="animate-pulse delay-200">●</span>
                                  <span className="ml-1">typing...</span>
                                </span>
                              ) : (
                                conversation.last_message || 'No messages yet'
                              )}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center shadow-sm">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              otherUser?.user_type === 'landlord'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {otherUser?.user_type}
                            </span>
                            {isOnline && (
                              <span className="text-xs text-green-600 font-medium">● Online</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start a conversation with someone!</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Action Button for Mobile */}
          <div className="md:hidden p-4 border-t border-gray-200">
            <button
              onClick={() => setShowUserSearch(true)}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Start New Chat</span>
            </button>
          </div>
        </div>

        {/* Chat Area - Always visible */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          activeConversation ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Mobile Chat Header - Adjusts height for mobile */}
          {activeConversation && (
            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 h-[60px] flex items-center">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <button
                  onClick={() => {
                    console.log('Back button clicked - clearing states');
                    setActiveConversation(null);
                    setSelectedUser(null);
                    setShowMobileNav(false);
                  }}
                  className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {selectedUser && (
                  <>
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                        {selectedUser?.avatar_url ? (
                          <img
                            src={selectedUser.avatar_url}
                            alt={selectedUser?.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-600">
                            {(selectedUser?.full_name || selectedUser?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {onlineUsers.has(selectedUser?.id) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {selectedUser?.full_name || selectedUser?.email}
                      </h3>
                      {onlineUsers.has(selectedUser?.id) && (
                        <span className="text-xs text-green-600">● Online</span>
                      )}
                    </div>
                  </>
                )}

                {!selectedUser && (
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Loading conversation...
                    </h3>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {selectedUser && (
                  <>
                    <button
                      onClick={() => handleWebRTCCall(selectedUser.id)}
                      className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Start video call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleVoiceCall(selectedUser.id)}
                      className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Start voice call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeConversation ? (
            <>
              {/* Chat Header - Only on desktop */}
              <div className="hidden md:block bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedUser && (
                      <>
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                            {selectedUser?.avatar_url ? (
                              <img
                                src={selectedUser.avatar_url}
                                alt={selectedUser?.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-600">
                                {(selectedUser?.full_name || selectedUser?.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {onlineUsers.has(selectedUser?.id) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {selectedUser?.full_name || selectedUser?.email}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              selectedUser?.user_type === 'landlord'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {selectedUser?.user_type}
                            </span>
                            {onlineUsers.has(selectedUser?.id) && (
                              <span className="text-xs text-green-600 font-medium">● Online</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {!selectedUser && (
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          Loading conversation...
                        </h3>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedUser && (
                      <>
                        <button
                          onClick={() => handleWebRTCCall(selectedUser.id)}
                          className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Start video call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVoiceCall(selectedUser.id)}
                          className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Start voice call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages - Modern mobile design */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white h-[calc(100%-60px)] md:h-[calc(100%-76px)]">
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const isOwn = message.sender_id === user?.id;
                    const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id);

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-[85%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {showAvatar && !isOwn && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {selectedUser?.avatar_url ? (
                                <img
                                  src={selectedUser.avatar_url}
                                  alt={selectedUser?.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-gray-600">
                                  {(selectedUser?.full_name || selectedUser?.email || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}

                          <div className={`relative group ${isOwn ? 'mr-2' : 'ml-2'}`}>
                            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                              isOwn
                                ? 'bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p className={`text-xs mt-1.5 ${
                                isOwn ? 'text-orange-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>

                            {/* Message tail */}
                            <div className={`absolute bottom-0 ${
                              isOwn
                                ? 'right-0 translate-x-1/2'
                                : 'left-0 -translate-x-1/2'
                            }`}>
                              <div className={`w-3 h-3 rotate-45 ${
                                isOwn
                                  ? 'bg-gradient-to-r from-[#FF6B35] to-orange-500'
                                  : 'bg-white border-l border-b border-gray-200'
                              }`}></div>
                            </div>

                            {/* Hover actions */}
                            <div className={`absolute top-0 ${
                              isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                            } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                              <div className="bg-white rounded-full shadow-lg p-1">
                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                  <MoreVertical className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Typing indicator */}
                {Array.from(isTyping.values()).some(typing => typing.conversationId === activeConversation) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">typing...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Modern Mobile Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <button
                    type="button"
                    className="p-3 text-gray-500 hover:text-[#FF6B35] hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <div className="relative bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/20 transition-all duration-200">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          if (e.target.value) {
                            startTyping(activeConversation);
                          } else {
                            stopTyping(activeConversation);
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 bg-transparent border-none focus:outline-none text-sm placeholder-gray-500 pr-12"
                      />

                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        <button
                          type="button"
                          className="p-1.5 text-gray-500 hover:text-[#FF6B35] rounded-lg transition-colors"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                      newMessage.trim()
                        ? 'bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Modern Empty State */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35]/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-[#FF6B35]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  No conversation selected
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Choose a conversation from the sidebar or start a new one to begin messaging
                </p>
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Start New Conversation</h3>
                  <button
                    onClick={() => setShowUserSearch(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent bg-gray-50"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {Array.from(onlineUsers.values()).length > 0 ? (
                  Array.from(onlineUsers.values()).map((onlineUser) => (
                    <div
                      key={onlineUser.id}
                      onClick={() => handleStartConversation(onlineUser)}
                      className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                          {onlineUser.avatar_url ? (
                            <img
                              src={onlineUser.avatar_url}
                              alt={onlineUser.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-600">
                              {(onlineUser.full_name || onlineUser.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {onlineUser.full_name || onlineUser.email}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            onlineUser.user_type === 'landlord'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {onlineUser.user_type}
                          </span>
                          <span className="text-xs text-green-600 font-medium">● Online</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No users online</p>
                    <p className="text-sm text-gray-400 mt-1">Check back later!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
        targetUser={selectedUser}
        targetUserId={selectedUser?.id}
      />

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        targetUser={selectedUser}
        targetUserId={selectedUser?.id}
      />
    </div>
  );
};

export default MessageCenter;
