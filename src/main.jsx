import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { MessagingProvider } from './contexts/MessagingContext';
import './index.css';
import App from './App';

// Initialize the app
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <MessagingProvider>
              <App />
            </MessagingProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
