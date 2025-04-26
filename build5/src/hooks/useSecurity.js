import { useState, useCallback } from 'react';
import {
  sanitizeInput,
  validateFile,
  escapeHtml,
  secureStorage,
  rateLimiters,
  secureFetch
} from '../utils/security';

export const useSecurity = () => {
  const [securityError, setSecurityError] = useState(null);

  // Input sanitization
  const sanitize = useCallback((input) => {
    try {
      return sanitizeInput(input);
    } catch (error) {
      setSecurityError('Input sanitization failed');
      return '';
    }
  }, []);

  // File validation
  const validateUpload = useCallback((file, options) => {
    try {
      return validateFile(file, options);
    } catch (error) {
      setSecurityError(error.message);
      return false;
    }
  }, []);

  // XSS protection
  const escape = useCallback((str) => {
    try {
      return escapeHtml(str);
    } catch (error) {
      setSecurityError('XSS protection failed');
      return '';
    }
  }, []);

  // Secure storage for OAuth data
  const secureStore = useCallback((key, value) => {
    try {
      secureStorage.setItem(key, value);
    } catch (error) {
      setSecurityError('Secure storage failed');
    }
  }, []);

  const secureRetrieve = useCallback((key) => {
    try {
      return secureStorage.getItem(key);
    } catch (error) {
      setSecurityError('Secure retrieval failed');
      return null;
    }
  }, []);

  // Clear OAuth data
  const clearAuthData = useCallback(() => {
    try {
      secureStorage.clearAuthData();
    } catch (error) {
      setSecurityError('Failed to clear auth data');
    }
  }, []);

  // Rate limiting
  const checkRateLimit = useCallback((type, key) => {
    try {
      return rateLimiters[type].check(key);
    } catch (error) {
      setSecurityError('Rate limit check failed');
      return false;
    }
  }, []);

  // Secure API calls with OAuth token
  const fetchSecurely = useCallback(async (url, options) => {
    try {
      return await secureFetch(url, options);
    } catch (error) {
      setSecurityError(error.message);
      throw error;
    }
  }, []);

  return {
    sanitize,
    validateUpload,
    escape,
    secureStore,
    secureRetrieve,
    clearAuthData,
    checkRateLimit,
    fetchSecurely,
    securityError,
    clearError: () => setSecurityError(null)
  };
}; 