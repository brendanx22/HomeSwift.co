import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const ForceUpdateButton = ({ showInDev = false }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, updating, success, error

  // Only show in production or if explicitly enabled for dev
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction && !showInDev) {
    return null;
  }

  const handleForceUpdate = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    setUpdateStatus('updating');

    try {
      console.log('🔄 Triggering force update...');

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ Browser caches cleared');
      }

      // Clear localStorage
      try {
        localStorage.clear();
        console.log('✅ LocalStorage cleared');
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }

      // Clear sessionStorage
      try {
        sessionStorage.clear();
        console.log('✅ SessionStorage cleared');
      } catch (e) {
        console.warn('Failed to clear sessionStorage:', e);
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('✅ Service workers unregistered');
      }

      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(databases.map(db => indexedDB.deleteDatabase(db.name)));
        console.log('✅ IndexedDB cleared');
      }

      setUpdateStatus('success');

      // Force reload after a short delay
      setTimeout(() => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const newUrl = window.location.origin + window.location.pathname + 
                       '?hard_reset=true&t=' + timestamp + '&r=' + random;
        
        console.log('🔄 Force reloading to:', newUrl);
        window.location.replace(newUrl);
      }, 1500);

    } catch (error) {
      console.error('❌ Force update failed:', error);
      setUpdateStatus('error');
      setIsUpdating(false);
    }
  };

  const getButtonContent = () => {
    switch (updateStatus) {
      case 'updating':
        return (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Updating...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Reloading...</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="w-4 h-4" />
            <span>Retry Update</span>
          </>
        );
      default:
        return (
          <>
            <RefreshCw className="w-4 h-4" />
            <span>Force Update</span>
          </>
        );
    }
  };

  const getButtonStyle = () => {
    const baseStyle = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm";
    
    switch (updateStatus) {
      case 'updating':
        return `${baseStyle} bg-blue-100 text-blue-700 border border-blue-200`;
      case 'success':
        return `${baseStyle} bg-green-100 text-green-700 border border-green-200`;
      case 'error':
        return `${baseStyle} bg-red-100 text-red-700 border border-red-200`;
      default:
        return `${baseStyle} bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200`;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="text-xs text-gray-600 mb-2 font-medium">
          {isProduction ? 'Production' : 'Development'} Tools
        </div>
        <button
          onClick={handleForceUpdate}
          disabled={isUpdating}
          className={getButtonStyle()}
          title="Force clear all caches and reload the app"
        >
          {getButtonContent()}
        </button>
        
        {updateStatus === 'success' && (
          <div className="text-xs text-green-600 mt-2">
            App is reloading with fresh cache...
          </div>
        )}
        
        {updateStatus === 'error' && (
          <div className="text-xs text-red-600 mt-2">
            Update failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default ForceUpdateButton;
