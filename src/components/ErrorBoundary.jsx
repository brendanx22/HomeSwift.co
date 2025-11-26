import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Try to clear cache if it's a JavaScript loading error
    if (error.message && error.message.includes('Unexpected token')) {
      console.log('Detected JavaScript loading error, clearing cache...');
      this.clearCacheAndReload();
    }
  }

  clearCacheAndReload = () => {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      });
    }

    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        return Promise.all(
          registrations.map(registration => registration.unregister())
        );
      });
    }
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      // Increment retry count
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        retryCount: retryCount + 1 
      });
      
      // Clear cache and reload
      this.clearCacheAndReload();
      
      // Force page reload after a short delay
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + '?retry=' + (retryCount + 1) + '&t=' + Date.now();
      }, 1000);
    } else {
      // Too many retries, clear everything and reload
      this.clearCacheAndReload();
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + '?hard_reset=' + Date.now();
      }, 1000);
    }
  };

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state;
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. This usually happens when there's a caching issue.
            </p>

            {this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-700 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#e85e2f] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {retryCount < 3 ? `Try Again (${retryCount + 1}/3)` : 'Force Reset'}
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Go to Homepage
              </button>
            </div>

            {retryCount >= 3 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Still having issues?</strong> Try clearing your browser cache completely or using a different browser.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
