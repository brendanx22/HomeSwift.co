import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import ChatList from '../components/ChatList';
import Messages from '../components/Messages';

/**
 * Main Chat Page - Combines ChatList sidebar and Messages window
 * This is the main messaging interface for both landlords and renters
 */
export default function Messaging() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeChatId, setActiveChatId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle direct chat navigation via query parameter
  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    if (chatIdFromUrl && chatIdFromUrl !== activeChatId) {
      setActiveChatId(chatIdFromUrl);
      // Clear the query parameter after setting it
      setSearchParams({});
    }
  }, [searchParams, activeChatId, setSearchParams]);

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    if (isMobile) {
      // On mobile, hide chat list when selecting a chat
      // This is handled by CSS classes in the JSX
    }
  };

  const handleStartNewChat = () => {
    // TODO: Implement new chat creation modal
    console.log('Starting new chat...');
  };

  const handleBackToList = () => {
    setActiveChatId(null);
    if (isMobile) {
      // This is handled by CSS classes in the JSX
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access messages</h2>
          <p className="text-gray-600">You need to be logged in to view your conversations.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="h-screen flex">
        {/* Chat List Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 ${
          isMobile && activeChatId ? 'hidden' : 'block'
        }`}>
          <ChatList
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onStartNewChat={handleStartNewChat}
          />
        </div>

        {/* Messages Window */}
        <div className={`flex-1 ${isMobile && !activeChatId ? 'hidden' : 'block'}`}>
          {activeChatId ? (
            <Messages
              chatId={activeChatId}
              currentUser={user}
              onBack={isMobile ? handleBackToList : null}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center px-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isMobile ? 'Select a conversation' : 'Select a conversation to start messaging'}
                </h3>
                <p className="text-gray-600">
                  Choose from your existing conversations or start a new one to connect with landlords and renters.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
