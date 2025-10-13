// src/components/RoleSwitcher.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const RoleSwitcher = () => {
  const { user, roles, currentRole, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render if user has only one role
  if (!roles || roles.length <= 1) {
    return null;
  }

  const currentRoleData = roles.find(r => r.role === currentRole) || roles[0];

  const getRoleLabel = (role) => {
    switch (role) {
      case 'landlord':
        return 'Landlord';
      case 'renter':
        return 'Renter';
      case 'admin':
        return 'Administrator';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const handleRoleChange = async (role) => {
    if (role !== currentRole) {
      await switchRole(role);
      // Refresh the page to apply role-specific changes
      window.location.reload();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          <span className="font-medium">{getRoleLabel(currentRole)}</span>
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Switch Role
              </div>
              {roles.map((role) => (
                <button
                  key={role.role}
                  onClick={() => handleRoleChange(role.role)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                    role.role === currentRole
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center">
                    <span>{getRoleLabel(role.role)}</span>
                    {role.is_primary && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        Primary
                      </span>
                    )}
                  </div>
                  {role.role === currentRole && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleSwitcher;
