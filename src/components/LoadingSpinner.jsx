import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  const logoSizeClasses = {
    small: 'w-10 h-10',
    default: 'w-20 h-20',
    large: 'w-32 h-32'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center ${className}`}
    >
      <div className="relative">
        {/* Animated logo */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6"
        >
          <img
            src="/images/logo.png"
            alt="HomeSwift"
            className={`${logoSizeClasses[size]} object-cover rounded-2xl shadow-lg`}
          />
        </motion.div>

        {/* Animated spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`${sizeClasses[size]} border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full mx-auto`}
        />
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;
