import Cookies from 'js-cookie';

// Session management
const SESSION_KEY = 'schedularr_session';
const CSRF_KEY = 'schedularr_csrf';
export const CSRF_HEADER = 'X-CSRF-Token';

// Generate a random token for CSRF protection
const generateToken = () => {
  const array = new Uint32Array(8);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
};

// Initialize session and CSRF protection
export const initializeSession = () => {
  // Check if session exists in localStorage
  const sessionToken = localStorage.getItem(SESSION_KEY);
  const csrfToken = localStorage.getItem(CSRF_KEY);

  if (!sessionToken) {
    // Create new session
    const newSessionToken = generateToken();
    const newCsrfToken = generateToken();
    
    // Store in localStorage
    localStorage.setItem(SESSION_KEY, newSessionToken);
    localStorage.setItem(CSRF_KEY, newCsrfToken);
    
    // Also set cookies for API requests if needed
    Cookies.set(SESSION_KEY, newSessionToken, {
      secure: true,
      sameSite: 'strict',
      expires: 7 // 7 days
    });
    
    Cookies.set(CSRF_KEY, newCsrfToken, {
      secure: true,
      sameSite: 'strict',
      expires: 7
    });
    
    return {
      sessionToken: newSessionToken,
      csrfToken: newCsrfToken
    };
  }

  return {
    sessionToken,
    csrfToken
  };
};

// Get CSRF token for API requests
export const getCsrfToken = () => {
  return localStorage.getItem(CSRF_KEY);
};

// Add CSRF token to fetch requests
export const fetchWithCsrf = async (url, options = {}) => {
  const csrfToken = getCsrfToken();
  
  const headers = {
    ...options.headers,
    [CSRF_HEADER]: csrfToken
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};

// Validate session locally
export const validateSession = () => {
  const sessionToken = localStorage.getItem(SESSION_KEY);
  return !!sessionToken; // Simple check if token exists
};

// Clear session
export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CSRF_KEY);
  Cookies.remove(SESSION_KEY);
  Cookies.remove(CSRF_KEY);
}; 