// Input validation and sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .trim();
};

// Rate limiting implementation
class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit; // Number of requests allowed
    this.windowMs = windowMs; // Time window in milliseconds
    this.requests = new Map();
  }

  check(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

// Create rate limiters for different operations
export const rateLimiters = {
  api: new RateLimiter(100, 60 * 1000), // 100 requests per minute
  fileUpload: new RateLimiter(10, 60 * 1000), // 10 uploads per minute
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }

  // Check file extension
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    throw new Error(`File extension ${extension} not allowed`);
  }

  return true;
};

// XSS Protection
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Secure storage wrapper for OAuth tokens and user data
export const secureStorage = {
  setItem(key, value) {
    try {
      const encryptedValue = btoa(encodeURIComponent(JSON.stringify(value)));
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error storing secure data:', error);
    }
  },

  getItem(key) {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      return JSON.parse(decodeURIComponent(atob(encryptedValue)));
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  },

  removeItem(key) {
    localStorage.removeItem(key);
  },

  // Clear all OAuth related data
  clearAuthData() {
    this.removeItem('google_auth_token');
    this.removeItem('user_profile');
    this.removeItem('session_data');
  }
};

// Secure API request wrapper with OAuth token handling
export const secureFetch = async (url, options = {}) => {
  try {
    // Get OAuth token from secure storage
    const authToken = secureStorage.getItem('google_auth_token');
    
    // Add security headers and OAuth token
    const headers = {
      ...options.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    };

    // Check rate limit
    const rateLimiter = rateLimiters.api;
    if (!rateLimiter.check('api')) {
      throw new Error('Rate limit exceeded');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // Check for security headers in response
    const securityHeaders = response.headers.get('X-Content-Type-Options');
    if (!securityHeaders) {
      console.warn('Missing security headers in API response');
    }

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      secureStorage.clearAuthData();
      // You might want to redirect to login or refresh the token here
    }

    return response;
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
}; 