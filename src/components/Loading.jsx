import React from 'react';

/**
 * Standardized Loading Component
 * Used consistently across all pages for loading states
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (sm, md, lg) - defaults to md
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactNode} - Loading spinner component
 */
export default function Loading({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex flex-col items-center justify-center ${size === 'sm' ? 'py-8' : 'min-h-screen'} bg-gray-50 ${className}`}>
      <div className={`${spinnerSize} border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin`}></div>
    </div>
  );
}
