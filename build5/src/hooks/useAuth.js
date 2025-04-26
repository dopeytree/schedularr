import { useState, useEffect } from 'react';
import { initializeSession, validateSession, clearSession } from '../utils/auth';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Initialize session if not exists
        initializeSession();
        
        // Validate session locally
        const isValid = validateSession();
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up periodic session validation
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    logout
  };
}; 