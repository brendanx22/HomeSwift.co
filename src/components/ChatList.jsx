import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Plus,
  MoreVertical,
  Clock,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * ChatList component - Sidebar showing user's conversations
 * @param {object} props
 * @param {string} props.activeChatId - Currently selected chat ID
 * @param {function} props.onSelectChat - Callback when chat is selected
 * @param {function} props.onStartNewChat - Callback when starting new chat
 */
export default function ChatList({ activeChatId, onSelectChat, onStartNewChat }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load user's chats
  useEffect(() => {
    if (user?.id) {
      loadChats();
    }
  }, [user?.id]);

  const loadChats = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/chats/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token || localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load chats: ${response.status}`);
      }

      const data = await response.json();
      setChats(data || []);
    } catch (err) {
      console.error('Error loading chats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.property_id?.includes(searchQuery)
  );

  // Format time ago for chat list
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Get chat display info (simplified - in real app you'd fetch property details)
  const getChatDisplayInfo = (chat) => {
    const isUnread = chat.unread_count > 0;
    const lastMessageTime = chat.last_message_time;
    const lastMessage = chat.last_message || 'No messages yet';

    return {
      title: `Property Chat ${chat.property_id?.slice(-6) || 'Unknown'}`,
      subtitle: lastMessage.length > 50 ? `${lastMessage.slice(0, 50)}...` : lastMessage,
      time: formatTimeAgo(lastMessageTime),
      unread: chat.unread_count || 0,
      isUnread
    };
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <button
            onClick={onStartNewChat}
            className="p-2 bg-[#FF6B35] text-white rounded-full hover:bg-orange-600 transition-colors"
            title="Start new chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF6B35] border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            <button
              onClick={loadChats}
              className="mt-2 text-xs text-[#FF6B35] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-[#FF6B35] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => {
              const displayInfo = getChatDisplayInfo(chat);
              const isActive = activeChatId === chat.chat_id;

              return (
                <motion.div
                  key={chat.chat_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isActive ? 'bg-orange-50 border-r-2 border-[#FF6B35]' : ''
                  }`}
                  onClick={() => onSelectChat(chat.chat_id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                      {displayInfo.title.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-medium truncate ${
                          displayInfo.isUnread ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {displayInfo.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {displayInfo.time}
                        </span>
                      </div>

                      <p className={`text-sm truncate ${
                        displayInfo.isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        {displayInfo.subtitle}
                      </p>

                      {displayInfo.unread > 0 && (
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF6B35] text-white">
                            {displayInfo.unread}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          <span>
            {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
