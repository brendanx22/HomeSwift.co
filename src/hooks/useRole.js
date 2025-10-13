// src/hooks/useRole.js
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to check if the current user has specific roles
 * @param {string|string[]} requiredRoles - Single role or array of roles to check
 * @returns {Object} - { hasRole: boolean, isCurrentRole: boolean, currentRole: string }
 */
export function useRole(requiredRoles = []) {
  const { hasRole, currentRole } = useAuth();

  // Convert single role to array for consistent handling
  const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return {
    hasRole: rolesToCheck.length > 0 ? rolesToCheck.some(role => hasRole(role)) : true,
    isCurrentRole: currentRole && rolesToCheck.includes(currentRole),
    currentRole
  };
}

/**
 * Hook to check if the current user has any of the specified roles
 * @param {string[]} requiredRoles - Array of roles to check
 * @returns {Object} - { hasAnyRole: boolean, currentRole: string, isInRole: boolean }
 */
export function useAnyRole(requiredRoles = []) {
  const { hasAnyRole, currentRole } = useAuth();

  return {
    hasAnyRole: hasAnyRole(requiredRoles),
    currentRole,
    isInRole: currentRole && requiredRoles.includes(currentRole)
  };
}
