import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  AlertCircle,
  MessageSquare,
  Image as ImageIcon,
  X,
  SmilePlus,
  Heart,
  ThumbsUp,
  Laugh,
  Frown,
  Angry,
  Search,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useRealtimeMessages';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

/**
 * Emoji Picker Component
 */
const EmojiPicker = ({ onSelect, onClose }) => {
  const emojis = [
    { emoji: '😊', name: 'happy' },
    { emoji: '❤️', name: 'heart' },
    { emoji: '👍', name: 'thumbs_up' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😢', name: 'sad' },
    { emoji: '😠', name: 'angry' },
    { emoji: '🎉', name: 'party' },
    { emoji: '🔥', name: 'fire' },
    { emoji: '💯', name: 'perfect' },
    { emoji: '👏', name: 'applause' },
    { emoji: '🙏', name: 'pray' },
    { emoji: '💪', name: 'strong' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-50"
      style={{ width: '280px' }}
    >
      <div className="grid grid-cols-6 gap-2">
        {emojis.map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(item.emoji)}
            className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-xl transition-colors"
          >
            {item.emoji}
          </motion.button>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

/**
 * File Attachment Preview Component
 */
const AttachmentPreview = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-3 overflow-x-auto">
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative bg-white rounded-xl border border-gray-200 p-3 shadow-sm min-w-[140px] max-w-[160px]"
          >
            <button
              onClick={() => onRemove(file.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
            >
              <X className="w-3 h-3" />
            </button>

            {file.type.startsWith('image/') ? (
              <div className="relative">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all duration-200" />
              </div>
            ) : (
              <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Paperclip className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs font-medium text-blue-700 truncate px-2">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-2 text-xs font-medium text-gray-700 truncate max-w-[120px]">
              {file.name}
            </div>
            <div className="text-[10px] text-gray-500">
              {Math.ceil(file.size / 1024)} KB
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/**
 * Message Bubble Component with enhanced styling
 */
const MessageBubble = ({ message, isCurrentUser, messageType, showAvatar, formatTime, index }) => {
  // Enhanced styling based on message type and user context
  const getBubbleStyles = () => {
    const baseStyles = 'relative px-4 py-3 rounded-2xl shadow-sm';

    if (isCurrentUser) {
      // Sent messages (current user)
      return `${baseStyles} bg-gradient-to-br from-[#FF6B35] to-[#ff5722] text-white rounded-br-md`;
    } else if (messageType === 'received-landlord') {
      // Received from landlord (when current user is renter)
      return `${baseStyles} bg-white text-gray-900 rounded-bl-md border border-gray-100`;
    } else if (messageType === 'received-renter') {
      // Received from renter (when current user is landlord)
      return `${baseStyles} bg-blue-50 text-blue-900 rounded-bl-md border border-blue-200`;
    } else {
      // Fallback for received messages
      return `${baseStyles} bg-white text-gray-900 rounded-bl-md border border-gray-100`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={`flex mb-4 w-full ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} flex items-end`}>
        {/* Avatar (only for received messages and first in group) */}
        {showAvatar && !isCurrentUser && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0 mr-3 ${
              messageType === 'received-landlord'
                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
            }`}
          >
            {messageType === 'received-landlord' ? 'L' : 'R'}
          </motion.div>
        )}

        {/* Message Bubble */}
        <div className={`relative`}>
          <div className={getBubbleStyles()}>
            {/* Message content */}
            <p className="text-sm leading-relaxed break-words">
              {message.message}
            </p>

            {/* Timestamp and status */}
            <div className={`flex items-center justify-between mt-2 text-xs ${
              isCurrentUser ? 'text-white/80' : 'text-gray-500'
            }`}>
              <span className="font-medium">
                {formatTime(message.created_at)}
              </span>

              {isCurrentUser && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-1"
                >
                  {message.read ? (
                    <CheckCheck className="w-3 h-3 text-blue-200" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </motion.div>
              )}
            </div>

            {/* Message tail */}
            <div className={`absolute ${
              isCurrentUser
                ? 'right-0 top-3 transform rotate-45'
                : 'left-0 top-3 transform -rotate-45'
            } w-3 h-3 ${
              isCurrentUser
                ? 'bg-gradient-to-br from-[#FF6B35] to-[#ff5722]'
                : messageType === 'received-landlord'
                  ? 'bg-white border-l border-t border-gray-100'
                  : 'bg-blue-50 border-l border-t border-blue-200'
            }`} />
          </div>

          {/* Hover effect for reply */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className={`absolute top-1/2 transform -translate-y-1/2 ${
              isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
            } opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <button className={`p-1.5 rounded-full ${
              isCurrentUser ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              <MessageSquare className={`w-3 h-3 ${isCurrentUser ? 'text-white' : 'text-gray-600'}`} />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Main Messages Component - Redesigned with modern, beautiful UI
 */
export default function Messages({ chatId, currentUser, onBack }) {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadingContext, setLoadingContext] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    messages,
    loading,
    error,
    chatContext,
    sendMessage,
    markAsRead
  } = useChat(chatId, currentUser);

  // Fetch chat context (participants and property info)
  useEffect(() => {
    const fetchChatContext = async () => {
      if (!chatId || !currentUser) return;

      setLoadingContext(true);
      try {
        // The chat context will be provided by the messages API response
        // We'll set it when we get the messages data
        console.log('⏳ Waiting for messages to load chat context...');
      } catch (err) {
        console.error('❌ Error in fetchChatContext:', err);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchChatContext();
  }, [chatId, currentUser]);

  // Set chat context when messages are loaded
  useEffect(() => {
    if (messages.length > 0 && chatContext) {
      console.log('✅ Chat context loaded from useChat hook:', chatContext);
      setLoadingContext(false);
    }
  }, [messages, chatContext]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when chat becomes active
  useEffect(() => {
    if (chatId && messages.length > 0) {
      markAsRead();
    }
  }, [chatId, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && attachments.length === 0) return;

    try {
      await sendMessage(messageText, attachments);
      setMessageText('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowAttachmentPicker(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const isCurrentUser = (senderId) => {
    const result = senderId === currentUser?.id;
    console.log('🔍 isCurrentUser check:', {
      senderId,
      currentUserId: currentUser?.id,
      currentUser: currentUser,
      result,
      chatContext: chatContext
    });
    return result;
  };

  // Enhanced message type detection
  const getMessageType = (senderId) => {
    if (senderId === currentUser?.id) return 'sent';

    if (chatContext?.isLandlordChat) {
      // Current user is landlord, so other participant is renter
      return 'received-renter';
    } else {
      // Current user is renter, so other participant is landlord
      return 'received-landlord';
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (files) => {
    const maxFiles = 5;
    const selected = Array.from(files).slice(0, maxFiles);
    const valid = [];

    for (const file of selected) {
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 25MB.`);
        continue;
      }
      const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`;
      const url = URL.createObjectURL(file);
      valid.push({ id, name: file.name, size: file.size, type: file.type || 'application/octet-stream', url });
    }

    setAttachments(prev => [...prev, ...valid]);
    setShowAttachmentPicker(false);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Loading state
  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-16 h-16 bg-gradient-to-r from-[#FF6B35] to-[#ff5722] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <MessageSquare className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-gray-600 font-medium">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <AlertCircle className="w-8 h-8 text-red-500" />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#ff5722] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header */}
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-4">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 107, 53, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-[#FF6B35] rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}

          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#ff5722] rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
            >
              CH
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
            />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {loadingContext ? (
                'Loading...'
              ) : chatContext?.otherParticipant ? (
                `${chatContext.otherParticipant.first_name} ${chatContext.otherParticipant.last_name}`
              ) : (
                'Property Chat'
              )}
            </h3>
            <p className="text-sm text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {loadingContext ? (
                'Loading...'
              ) : chatContext?.property ? (
                `${chatContext.property.title} • ${chatContext.isLandlordChat ? 'Landlord' : 'Renter'}`
              ) : (
                `${messages.length} message${messages.length !== 1 ? 's' : ''}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 107, 53, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="p-3 text-gray-600 hover:text-[#FF6B35] rounded-xl transition-colors"
          >
            <Phone className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 107, 53, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="p-3 text-gray-600 hover:text-[#FF6B35] rounded-xl transition-colors"
          >
            <Video className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 107, 53, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="p-3 text-gray-600 hover:text-[#FF6B35] rounded-xl transition-colors"
          >
            <Info className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Messages Container - Takes remaining space */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-transparent to-gray-100/30 min-h-0">
        <div className="max-w-4xl mx-auto h-full">
          <AnimatePresence>
            {messages.map((message, index) => {
              const isCurrentUserMessage = isCurrentUser(message.sender_id);
              const messageType = getMessageType(message.sender_id);
              const showAvatar = !isCurrentUserMessage && (index === 0 || !isCurrentUser(messages[index - 1]?.sender_id));

              console.log('📨 Rendering message:', {
                index,
                messageId: message.id,
                senderId: message.sender_id,
                isCurrentUserMessage,
                messageType,
                showAvatar,
                message: message.message,
                chatContext: chatContext
              });

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUserMessage}
                  messageType={messageType}
                  showAvatar={showAvatar}
                  formatTime={formatMessageTime}
                  index={index}
                />
              );
            })}
          </AnimatePresence>

          {/* Beautiful Empty State */}
          {!loading && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center h-full min-h-[400px]"
            >
              <div className="text-center max-w-md mx-auto">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#ff5722] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                >
                  <MessageSquare className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Start a conversation
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Send a message to begin chatting about this property. Ask questions, schedule viewings, or discuss details!
                </p>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Attachment Preview */}
      <AttachmentPreview files={attachments} onRemove={removeAttachment} />

      {/* Modern Message Input - Fixed at bottom */}
      <div className="p-6 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative">
            <div className="flex items-end space-x-4 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/20 transition-all duration-200">
              {/* Attachment Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAttachmentPicker(!showAttachmentPicker)}
                className="p-3 text-gray-500 hover:text-[#FF6B35] transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </motion.button>

              {/* Message Input */}
              <div className="flex-1 relative">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-3 bg-transparent focus:outline-none resize-none text-gray-900 placeholder-gray-500"
                  style={{
                    minHeight: '48px',
                    maxHeight: '120px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />

                {/* Emoji Picker Toggle */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-400 hover:text-[#FF6B35] rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Send Button */}
              <motion.button
                type="submit"
                disabled={!messageText.trim() && attachments.length === 0}
                whileHover={!(!messageText.trim() && attachments.length === 0) ? { scale: 1.05 } : {}}
                whileTap={!(!messageText.trim() && attachments.length === 0) ? { scale: 0.95 } : {}}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  messageText.trim() || attachments.length > 0
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#ff5722] text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2">
                  <EmojiPicker
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files || [])}
            />
          </form>

          {/* Helper Text */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
