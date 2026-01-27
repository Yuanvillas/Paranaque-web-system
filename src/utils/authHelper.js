/**
 * Utility functions for managing authentication state
 */

/**
 * Clear all authentication data from localStorage
 * Call this function whenever a user logs out to ensure complete session cleanup
 */
export const clearAuthData = () => {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

/**
 * Get stored user data from localStorage
 * Returns parsed user object or null if not found
 */
export const getStoredUser = () => {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error("Error parsing stored user data:", e);
    return null;
  }
};

/**
 * Check if user is authenticated
 * Returns true if both userEmail and user data exist in localStorage
 */
export const isAuthenticated = () => {
  const userEmail = localStorage.getItem("userEmail");
  const user = localStorage.getItem("user");
  return !!(userEmail && user);
};

/**
 * Get user email from localStorage
 */
export const getUserEmail = () => {
  return localStorage.getItem("userEmail");
};

/**
 * Get user role from localStorage
 */
export const getUserRole = () => {
  return localStorage.getItem("userRole");
};
