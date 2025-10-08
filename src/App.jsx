import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandlordLoginPage from './pages/LandlordLoginPage';
import LandlordSignupPage from './pages/LandlordSignupPage';
import ChatPage from './pages/ChatPage';
import LandlordDashboard from './pages/LandlordDashboard';
import UserTypeSelection from './pages/UserTypeSelection';

// Main App Layout
function AppLayout() {
  const { user, userType, signOut } = useAuth();

  return (

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/landlord/login" element={<LandlordLoginPage />} />
          <Route path="/landlord/signup" element={<LandlordSignupPage />} />
          <Route path="/user-type" element={<UserTypeSelection />} />
          
          {/* Protected routes */}
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute requiredUserType="renter">
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/landlord/dashboard" 
            element={
              <ProtectedRoute requiredUserType="landlord">
                <LandlordDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );
}

// App wrapper with providers
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <DashboardProvider>
          <AppLayout />
        </DashboardProvider>
      </AuthProvider>
    </Router>
  );
}
