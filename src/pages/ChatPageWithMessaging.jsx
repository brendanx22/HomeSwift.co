import React from 'react';
import { MessagingProvider } from '../contexts/MessagingContext';
import ChatPage from './ChatPage';

const ChatPageWithMessaging = () => {
  return (
    <MessagingProvider>
      <ChatPage />
    </MessagingProvider>
  );
};

export default ChatPageWithMessaging;
