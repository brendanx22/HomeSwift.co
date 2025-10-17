import React from 'react';
import { ArrowLeft } from 'lucide-react';

const Header = ({ showBack = false, onBack, title = '', className = '' }) => {
  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-30 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            {showBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {title && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
