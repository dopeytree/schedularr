import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import DOMPurify from 'dompurify';
import isEmail from 'validator/lib/isEmail';
import logo from './assets/logo.svg';
import { emojiBlast } from "emoji-blast";
import RandomEnding from './components/Extra/RandomEnding.jsx';
import Tooltip from './components/Tooltip.jsx';
import Divider from './components/Divider.jsx';
import ColourDropdown from './components/ColourDropdown.jsx';
import { getGradientClass, getTextGradientClass, getShadowGradientStyle } from './components/GradientColours.jsx';
import { cn } from './utils/cn.jsx';

// Version number for the app
const VERSION = "v0.7";

// Sanitize input to prevent XSS
const sanitize = (input) => DOMPurify.sanitize(input);

// Validate access token by attempting to fetch user info
const validateAccessToken = async (accessToken) => {
  try {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) {
      return false; // Token is invalid or unauthorized
    }
    return response.ok;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Token validation error:', err);
    }
    return false;
  }
};

// Fetch user's calendar list
const fetchCalendarList = async (accessToken, onInvalidToken) => {
  try {
    const isValidToken = await validateAccessToken(accessToken);
    if (!isValidToken) {
      onInvalidToken();
      return [];
    }
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) {
      onInvalidToken();
      return [];
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar list: HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.items || [];
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Calendar list fetch error:', err);
    }
    return [];
  }
};

// Find existing Schedularr calendar
const findSchedularrCalendar = async (accessToken, calendarName = 'Schedularr', onInvalidToken) => {
  try {
    const isValidToken = await validateAccessToken(accessToken);
    if (!isValidToken) {
      onInvalidToken();
      return null;
    }
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) {
      onInvalidToken();
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar list: HTTP ${response.status}`);
    }
    const data = await response.json();
    const schedularrCalendar = data.items.find(cal => cal.summary === calendarName);
    return schedularrCalendar ? schedularrCalendar.id : null;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Calendar list error:', err);
    }
    return null;
  }
};

// Create new calendar with unique name
const createSchedularrCalendar = async (accessToken, calendarName = 'Schedularr', attempt = 0, onInvalidToken) => {
  try {
    const isValidToken = await validateAccessToken(accessToken);
    if (!isValidToken) {
      onInvalidToken();
      throw new Error('Invalid access token');
    }
    const existingId = await findSchedularrCalendar(accessToken, calendarName, onInvalidToken);
    if (existingId) {
      return existingId;
    }
    const uniqueName = attempt > 0 ? `${calendarName} ${attempt}` : calendarName;
    const existingUniqueId = await findSchedularrCalendar(accessToken, uniqueName, onInvalidToken);
    if (existingUniqueId) {
      return createSchedularrCalendar(accessToken, calendarName, attempt + 1, onInvalidToken);
    }
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: sanitize(uniqueName),
        description: `Calendar for ${sanitize(uniqueName)} bookings`,
        timeZone: 'UTC',
      }),
    });
    if (response.status === 401 || response.status === 403) {
      onInvalidToken();
      throw new Error('Invalid access token');
    }
    if (!response.ok) {
      throw new Error(`Failed to create calendar: HTTP ${response.status}`);
    }
    const data = await response.json();
    if (process.env.NODE_ENV !== 'production') {
      console.log('Created calendar:', data);
    }
    return data.id;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Calendar creation error:', err);
    }
    throw new Error(`Failed to create calendar: ${sanitize(err.message)}`);
  }
};

// Share Schedularr calendar with an email
const shareSchedularrCalendar = async (calendarId, email, accessToken, onInvalidToken) => {
  try {
    const isValidToken = await validateAccessToken(accessToken);
    if (!isValidToken) {
      onInvalidToken();
      throw new Error('Invalid access token');
    }
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(sanitize(calendarId))}/acl`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'writer',
        scope: { type: 'user', value: sanitize(email) },
      }),
    });
    if (response.status === 401 || response.status === 403) {
      onInvalidToken();
      throw new Error('Invalid access token');
    }
    if (!response.ok) {
      const errorData = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.error('Share calendar error response:', errorData);
      }
      throw new Error(`Failed to share calendar: ${sanitize(errorData.error.message)}`);
    }
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Calendar sharing error:', err);
    }
    throw new Error(`Failed to share calendar: ${sanitize(err.message)}`);
  }
};

// Fetch shared users for a calendar with retry logic
const fetchSharedUsers = async (calendarId, accessToken, onInvalidToken, retries = 3, delay = 1000) => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const isValidToken = await validateAccessToken(accessToken);
      if (!isValidToken) {
        onInvalidToken();
        return JSON.parse(localStorage.getItem('sharedUsers') || '[]');
      }
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(sanitize(calendarId))}/acl`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 401 || response.status === 403) {
        onInvalidToken();
        return JSON.parse(localStorage.getItem('sharedUsers') || '[]');
      }
      if (response.status === 429 || response.status === 503) {
        if (attempt === retries) {
          setSubmissionError('API rate limit exceeded or service unavailable. Using cached data.');
          return JSON.parse(localStorage.getItem('sharedUsers') || '[]');
        }
        await wait(delay * Math.pow(2, attempt - 1));
        continue;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch shared users: HTTP ${response.status}`);
      }
      const data = await response.json();
      const users = data.items
        .filter(item => item.scope.type === 'user' && item.scope.value && isEmail(item.scope.value))
        .map(item => sanitize(item.scope.value))
        .filter(value => !value.endsWith('@group.calendar.google.com') && value.length < 50);
      localStorage.setItem('sharedUsers', JSON.stringify({ users, timestamp: Date.now() }));
      return users;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Fetch shared users error (attempt ${attempt}/${retries}):`, err);
      }
      if (attempt === retries) {
        const cached = JSON.parse(localStorage.getItem('sharedUsers') || '{}');
        if (cached.timestamp && Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('sharedUsers');
          return [];
        }
        return cached.users || [];
      }
      await wait(delay * Math.pow(2, attempt - 1));
    }
  }
  return JSON.parse(localStorage.getItem('sharedUsers') || '[]');
};

// Shadcn UI Components with hover animations
const Input = ({ className, inputGradient, ...props }) => {
  return (
    <div className="relative w-full">
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105",
          className
        )}
        style={{ boxShadow: getShadowGradientStyle(inputGradient) }}
        onMouseEnter={(e) => e.target.style.boxShadow = getShadowGradientStyle(inputGradient, true)}
        onMouseLeave={(e) => e.target.style.boxShadow = getShadowGradientStyle(inputGradient)}
        {...props}
      />
    </div>
  );
};

const Textarea = ({ className, inputGradient, ...props }) => {
  return (
    <div className="relative w-full">
      <textarea
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105",
          className
        )}
        style={{ boxShadow: getShadowGradientStyle(inputGradient), resize: 'none' }}
        onMouseEnter={(e) => e.target.style.boxShadow = getShadowGradientStyle(inputGradient, true)}
        onMouseLeave={(e) => e.target.style.boxShadow = getShadowGradientStyle(inputGradient)}
        {...props}
      />
    </div>
  );
};

const Button = ({ className, variant = "default", buttonGradient, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    gradient: getGradientClass(buttonGradient) + " text-white focus:ring-blue-500 transform hover:scale-105",
    gradientReverse: getGradientClass(buttonGradient, 'to-l') + " text-white focus:ring-blue-500 transform hover:scale-105",
    text: `text-${buttonGradient}-400 hover:text-${buttonGradient}-300 focus:ring-${buttonGradient}-500`,
    share: getGradientClass(buttonGradient) + " text-white focus:ring-blue-500 transform hover:scale-105",
  };
  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
};

const Card = ({ className, ...props }) => (
  <div
    className={cn(
      "bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl",
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }) => (
  <div className={cn("p-2 sm:p-2 text-center", className)} {...props} />
);

const CardTitle = ({ className, inputGradient, ...props }) => {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold mb-1",
        getTextGradientClass(inputGradient),
        className
      )}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 sm:p-8 pt-0", className)} {...props} />
);

const Alert = ({ className, variant = "default", inputGradient, onDismiss, ...props }) => {
  const baseStyles = "relative w-full rounded-lg border p-4 text-center cursor-pointer transition-opacity duration-500";
  const variants = {
    default: "bg-gray-700/80 text-gray-300 border-gray-600",
    destructive: "bg-red-900/50 text-red-400 border-red-600 animate-pulse",
    success: getGradientClass(inputGradient) + " text-white border-transparent animate-bounce",
  };
  return (
    <div
      role="alert"
      className={cn(
        baseStyles,
        variants[variant],
        className
      )}
      onClick={onDismiss}
      {...props}
    />
  );
};

const Tabs = ({ value, onValueChange, children }) => {
  return (
    <div>
      {React.Children.map(children, child => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { value, onValueChange });
        }
        return React.cloneElement(child, { value });
      })}
    </div>
  );
};

const TabsList = ({ className, value, onValueChange, ...props }) => (
  <div
    className={cn(
      "flex bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 shadow-lg w-full max-w-[400px] mx-auto",
      className
    )}
    {...props}
  >
    {React.Children.map(props.children, child => {
      if (child.type === TabsTrigger) {
        return React.cloneElement(child, { value, onValueChange });
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({ value, onValueChange, tabValue, className, variant = "gradient", buttonGradient, ...props }) => {
  const baseStyles = "flex-1 py-3 px-6 text-lg font-semibold flex items-center justify-center transition-all duration-300";
  const variants = {
    gradient: getGradientClass(buttonGradient) + " text-white focus:ring-blue-500 transform hover:scale-105",
    gradientReverse: getGradientClass(buttonGradient, 'to-l') + " text-white focus:ring-blue-500 transform hover:scale-105",
  };
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        value === tabValue ? cn(
          variant === "gradient" ? getGradientClass(buttonGradient) :
          variant === "gradientReverse" ? getGradientClass(buttonGradient, 'to-l') : "",
          "text-cyan-300"
        ) : "",
        className
      )}
      onClick={() => onValueChange(tabValue)}
      {...props}
    />
  );
};

const TabsContent = ({ value, tabValue, className, ...props }) => (
  <div
    className={cn(
      value === tabValue ? "block" : "hidden",
      className
    )}
    {...props}
  />
);

const App = () => {
  const CLIENT_ID = '32569943087-v0hk6vf7krtq1b2v5e1okhp0v5jqeih1.apps.googleusercontent.com';

  const [event, setEvent] = useState({
    name: '',
    startDate: '',
    startTime: '',
    duration: '',
    note: '',
  });
  const [endTime, setEndTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState(() => {
    return localStorage.getItem('hourlyRate') ? parseFloat(localStorage.getItem('hourlyRate')) : 20;
  });
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || '£';
  });
  const [appTitle, setAppTitle] = useState(() => {
    return localStorage.getItem('appTitle') || 'A Grande Day Out';
  });
  const [calendarId, setCalendarId] = useState(() => {
    return localStorage.getItem('calendarId') || '';
  });
  const [calendarName, setCalendarName] = useState(() => {
    return localStorage.getItem('calendarName') || 'Schedularr';
  });
  const [customCalendarName, setCustomCalendarName] = useState('');
  const [showCustomCalendarInput, setShowCustomCalendarInput] = useState(false);
  const [showCalendarList, setShowCalendarList] = useState(false);
  const [calendarList, setCalendarList] = useState([]);
  const [sharedUsers, setSharedUsers] = useState(() => {
    const cached = JSON.parse(localStorage.getItem('sharedUsers') || '{}');
    if (cached.timestamp && Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('sharedUsers');
      return [];
    }
    return cached.users || [];
  });
  const [shareEmail, setShareEmail] = useState('');
  const [inputGradient, setInputGradient] = useState(() => {
    return localStorage.getItem('inputGradient') || 'gold';
  });
  const [buttonGradient, setButtonGradient] = useState(() => {
    return localStorage.getItem('buttonGradient') || 'grey';
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const [cost, setCost] = useState(0);
  const [activeTab, setActiveTab] = useState('booking');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [timeError, setTimeError] = useState('');
  const [calendarIdError, setCalendarIdError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submissionOutput, setSubmissionOutput] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('isSignedIn') === 'true';
  });
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [devMode, setDevMode] = useState(() => {
    return localStorage.getItem('devMode') === 'true';
  });
  const [showGuide, setShowGuide] = useState(false);

  // Persist non-sensitive state to localStorage
  useEffect(() => {
    localStorage.setItem('isSignedIn', isSignedIn);
    localStorage.setItem('hourlyRate', hourlyRate);
    localStorage.setItem('currency', currency);
    localStorage.setItem('appTitle', appTitle);
    localStorage.setItem('calendarId', calendarId);
    localStorage.setItem('calendarName', calendarName);
    localStorage.setItem('inputGradient', inputGradient);
    localStorage.setItem('buttonGradient', buttonGradient);
    localStorage.setItem('devMode', devMode);
    localStorage.setItem('sharedUsers', JSON.stringify({ users: sharedUsers, timestamp: Date.now() }));
  }, [isSignedIn, hourlyRate, currency, appTitle, calendarId, calendarName, inputGradient, buttonGradient, devMode, sharedUsers]);

  const handleInvalidToken = () => {
    setSubmissionError('Session expired. Please sign in again.');
    handleLogout();
  };

  useEffect(() => {
    if (isSignedIn && accessToken) {
      fetchCalendarList(accessToken, handleInvalidToken).then(calendars => {
        setCalendarList(calendars);
      });
    }
  }, [isSignedIn, accessToken]);

  useEffect(() => {
    if (calendarId && accessToken && isSignedIn) {
      fetchSharedUsers(calendarId, accessToken, handleInvalidToken).then(users => {
        setSharedUsers(users);
      });
    } else if (!calendarId) {
      const cached = JSON.parse(localStorage.getItem('sharedUsers') || '{}');
      if (cached.timestamp && Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('sharedUsers');
        setSharedUsers([]);
      } else {
        setSharedUsers(cached.users || []);
      }
    }
  }, [calendarId, accessToken, isSignedIn]);

  useEffect(() => {
    let intervalId;
    if (!isSignedIn && isAnimating) {
      const animate = () => {
        const blastYPos = window.innerHeight - 10;
        const rocket = () => {
          emojiBlast({
            emojiCount: 1,
            emojis: ["🚀"],
            physics: {
              fontSize: 45,
              gravity: 0,
              initialVelocities: { x: 12, y: -10 },
              rotation: 0,
              rotationDeceleration: 0
            },
            position: { x: 150, y: blastYPos }
          });
        };
        const clouds = () => {
          emojiBlast({
            emojiCount: 10,
            emojis: ["☁️"],
            physics: {
              fontSize: { max: 50, min: 38 },
              gravity: 0.1,
              initialVelocities: { x: { max: 7, min: -7 }, y: { max: -2, min: -5 } },
              rotation: 0,
              rotationDeceleration: 0
            },
            position: { x: 150, y: blastYPos }
          });
        };
        const sparkles = () => {
          emojiBlast({
            emojiCount: 10,
            emojis: ["✨"],
            physics: {
              fontSize: { max: 30, min: 10 },
              gravity: 0.2,
              initialVelocities: { x: { max: 20, min: -15 }, y: { max: 20, min: -15 } },
            },
            position: { x: 200, y: blastYPos - 60 }
          });
        };
        rocket();
        clouds();
        setTimeout(sparkles, 400);
      };
      animate();
      intervalId = setInterval(animate, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSignedIn, isAnimating]);

  const handleSignIn = () => {
    setIsAnimating(false);
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setSubmissionError('Google Identity Services not loaded. Please check your network and try again.');
      if (process.env.NODE_ENV !== 'production') {
        console.error('Google Identity Services script not loaded.');
      }
      return;
    }
    const state = Math.random().toString(36).substring(2);
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      state,
      callback: (response) => {
        if (response.error || response.state !== state) {
          setSubmissionError(`Google sign-in failed: ${response.error || 'CSRF verification failed'}`);
          if (process.env.NODE_ENV !== 'production') {
            console.error('Sign-in error:', response);
          }
          return;
        }
        setAccessToken(response.access_token);
        setIsSignedIn(true);
        fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch user info');
            return res.json();
          })
          .then(data => {
            setUserEmail(sanitize(data.email));
            setUserName(sanitize(data.name || data.given_name || 'User'));
            if (process.env.NODE_ENV !== 'production') {
              console.log('User signed in:', data.email, 'Name:', data.name);
            }
          })
          .catch(err => {
            setSubmissionError(`Failed to fetch user info: ${sanitize(err.message)}`);
            if (process.env.NODE_ENV !== 'production') {
              console.error('User info error:', err);
            }
          });
      },
    });
    tokenClient.requestAccessToken();
  };

  const handleSkipLogin = () => {
    setIsSignedIn(true);
    setDevMode(true);
    setIsAnimating(false);
  };

  const handleLogout = () => {
    if (accessToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Access token revoked');
        }
      });
    }
    localStorage.clear();
    setIsSignedIn(false);
    setAccessToken('');
    setUserEmail('');
    setUserName('');
    setCalendarId('');
    setCalendarName('Schedularr');
    setSubmissionError('');
    setSubmissionOutput('');
    setShareError('');
    setShareSuccess('');
    setShowCalendar(false);
    setIsAnimating(true);
    setSharedUsers([]);
  };

  useEffect(() => {
    if (isSignedIn && !calendarId && !devMode && accessToken) {
      createSchedularrCalendar(accessToken, calendarName, 0, handleInvalidToken)
        .then(newId => {
          setCalendarId(newId);
          localStorage.setItem('calendarId', newId);
          setSubmissionOutput(`${sanitize(calendarName)} calendar found or created successfully!`);
          if (process.env.NODE_ENV !== 'production') {
            console.log('Calendar ID set:', newId);
          }
        })
        .catch(err => setSubmissionError(sanitize(err.message)));
    }
  }, [isSignedIn, calendarId, devMode, accessToken, calendarName]);

  const validateTime = (time) => {
    if (!time) return false;
    const minutes = parseInt(time.split(':')[1], 10);
    return [0, 15, 30, 45].includes(minutes);
  };

  const validateCalendarId = (id) => {
    if (!id) return false;
    const regex = /^[a-zA-Z0-9._%+-]+@group\.calendar\.google\.com$/;
    return regex.test(id);
  };

  const validateEmail = (email) => isEmail(email);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEvent({ ...event, [name]: sanitize(value) });
    setSubmissionError('');
    setSubmissionOutput('');
  };

  const handleHourlyRateChange = (e) => {
    const value = e.target.value;
    const rate = value ? parseFloat(value) : 0;
    setHourlyRate(rate);
  };

  const handleCurrencyChange = (e) => {
    setCurrency(sanitize(e.target.value));
  };

  const handleAppTitleChange = (e) => {
    setAppTitle(sanitize(e.target.value));
  };

  const handleCalendarIdChange = (e) => {
    const id = sanitize(e.target.value);
    setCalendarId(id);
    if (!validateCalendarId(id) && id) {
      setCalendarIdError('Invalid Calendar ID. It should look like abc123@group.calendar.google.com');
    } else {
      setCalendarIdError('');
    }
  };

  const handleCustomCalendarNameChange = (e) => {
    setCustomCalendarName(sanitize(e.target.value));
  };

  const handleCreateCustomCalendar = async () => {
    if (!customCalendarName) {
      setCalendarIdError('Please enter a custom calendar name.');
      return;
    }
    try {
      const newId = await createSchedularrCalendar(accessToken, customCalendarName, 0, handleInvalidToken);
      setCalendarId(newId);
      setCalendarName(customCalendarName);
      localStorage.setItem('calendarId', newId);
      localStorage.setItem('calendarName', customCalendarName);
      setSubmissionOutput(`${sanitize(customCalendarName)} calendar found or created successfully!`);
      setShowCustomCalendarInput(false);
      setCustomCalendarName('');
    } catch (err) {
      setSubmissionError(sanitize(err.message));
    }
  };

  const handleCalendarSelect = (calendar) => {
    setCalendarId(sanitize(calendar.id));
    setCalendarName(sanitize(calendar.summary));
    localStorage.setItem('calendarId', calendar.id);
    localStorage.setItem('calendarName', calendar.summary);
    setShowCalendarList(false);
    setSubmissionOutput(`Selected calendar: ${sanitize(calendar.summary)}`);
  };

  const handleShareEmailChange = (e) => {
    setShareEmail(sanitize(e.target.value));
    setShareError('');
    setShareSuccess('');
  };

  const handleInputGradientChange = (e) => {
    setInputGradient(sanitize(e.target.value));
  };

  const handleButtonGradientChange = (e) => {
    setButtonGradient(sanitize(e.target.value));
  };

  const handleDefaultColors = () => {
    setInputGradient('gold');
    setButtonGradient('grey');
  };

  const handleDevModeChange = (e) => {
    setDevMode(e.target.checked);
  };

  const handleShareCalendar = async () => {
    if (!validateEmail(shareEmail)) {
      setShareError('Please enter a valid email address.');
      return;
    }
    if (!calendarId) {
      setShareError('No calendar selected. Please create or select a calendar first.');
      return;
    }
    try {
      await shareSchedularrCalendar(calendarId, shareEmail, accessToken, handleInvalidToken);
      setShareSuccess(`Calendar shared successfully with ${sanitize(shareEmail)}!`);
      setShareEmail('');
      const updatedUsers = await fetchSharedUsers(calendarId, accessToken, handleInvalidToken);
      setSharedUsers(updatedUsers);
      setTimeout(() => {
        setShareSuccess('');
      }, 10000);
    } catch (err) {
      setShareError(sanitize(err.message));
      setTimeout(() => {
        setShareError('');
      }, 10000);
    }
  };

  useEffect(() => {
    if (event.startDate && event.startTime && event.duration) {
      if (!validateTime(event.startTime)) {
        setTimeError('Start time must be in 15-minute increments (00, 15, 30, 45).');
        return;
      }
      setTimeError('');
      const [year, month, day] = event.startDate.split('-');
      const isoDate = `${year}-${month}-${day}`;
      const start = new Date(`${isoDate}T${event.startTime}`);
      if (isNaN(start.getTime())) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Invalid date format:', `${isoDate}T${event.startTime}`);
        }
        setTimeError('Invalid date or time format.');
        return;
      }
      const durationMs = parseFloat(event.duration) * 60 * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);
      const calculatedEndDate = end.toISOString().split('T')[0];
      const calculatedEndTime = end.toTimeString().slice(0, 5);
      setEndTime(calculatedEndTime);
      setEndDate(calculatedEndDate);
      const calculatedFee = parseFloat(event.duration) * hourlyRate;
      setCost(Math.round(calculatedFee));
    } else {
      setEndTime('');
      setEndDate('');
      setCost(0);
      setTimeError('');
    }
  }, [event.startDate, event.startTime, event.duration, hourlyRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError('');
    setSubmissionOutput('');
    const errors = [];
    if (!devMode) {
      if (!isSignedIn) errors.push('Please sign in with Google.');
      if (!event.name) errors.push('Session Title is required.');
      if (!event.startDate) errors.push('Start Date is required.');
      if (!event.startTime) errors.push('Start Time is required.');
      else if (!validateTime(event.startTime)) errors.push('Start Time must be in 15-minute increments (00, 15, 30, 45).');
      if (!event.duration || event.duration <= 0) errors.push('Duration must be a positive number (minimum 0.5 hours).');
      if (!validateCalendarId(calendarId)) errors.push('A valid Google Calendar ID is required.');
    }
    const submissionData = {
      name: event.name || 'N/A',
      startDate: event.startDate || 'N/A',
      startTime: event.startTime || 'N/A',
      endDate: endDate || 'N/A',
      endTime: endTime || 'N/A',
      note: event.note || 'N/A',
      calendarId: calendarId || 'N/A',
      userEmail: userEmail || 'Not signed in',
    };
    let apiResponse = 'N/A';
    if (errors.length === 0 || devMode) {
      try {
        const isValidToken = await validateAccessToken(accessToken);
        if (!isValidToken) {
          handleInvalidToken();
          return;
        }
        const eventData = {
          summary: sanitize(event.name) || 'Test Event',
          description: `Duration: ${event.duration} hours\nFee: ${sanitize(currency)}${cost}${event.note ? `\nNote: ${sanitize(event.note)}` : ''}`,
          start: {
            dateTime: `${event.startDate}T${event.startTime}:00Z`,
            timeZone: 'UTC',
          },
          end: {
            dateTime: `${endDate}T${endTime}:00Z`,
            timeZone: 'UTC',
          },
        };
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(sanitize(calendarId))}/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
        if (response.status === 401 || response.status === 403) {
          handleInvalidToken();
          return;
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error.message);
        }
        const result = await response.json();
        apiResponse = `Event created: ${result.htmlLink}`;
      } catch (err) {
        apiResponse = `Error: ${sanitize(err.message)}`;
        if (!devMode) {
          errors.push(`Failed to create event: ${sanitize(err.message)}`);
        }
      }
    }
    const output = `Submission attempted:
Raw Data: ${JSON.stringify(submissionData, null, 2)}
API Response: ${apiResponse}
Note: Ensure you're signed into Google Calendar with the correct account.
Status: ${errors.length > 0 && !devMode ? 'Failed due to errors' : 'Event sent to Google Calendar'}`;
    setSubmissionOutput(output);
    if (errors.length > 0 && !devMode) {
      setSubmissionError(errors.join(' '));
      setTimeout(() => {
        setSubmissionError('');
      }, 10000);
      return;
    }
    if (typeof confetti !== 'undefined') {
      setShowConfetti(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#3b82f6', '#ec4899'],
        duration: 3000,
      });
      setTimeout(() => {
        setShowConfetti(false);
      }, 10000);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Confetti library not loaded; skipping animation.');
      }
    }
    setCalendarKey(prevKey => prevKey + 1);
    setEvent({
      name: '',
      startDate: '',
      startTime: '',
      duration: '',
      note: '',
    });
    setEndTime('');
    setEndDate('');
    setCost(0);
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    if (!showCalendar && calendarId) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Showing calendar with src:', `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=UTC`);
      }
    }
  };

  const openCalendarLink = () => {
    if (calendarId) {
      window.open(`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(sanitize(calendarId))}&ctz=UTC`, '_blank');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6">
      {submissionError && (
        <Alert
          variant="destructive"
          className="mb-4"
          onDismiss={() => setSubmissionError('')}
        >
          {submissionError}
        </Alert>
      )}
      {!isSignedIn ? (
        <div className="text-center">
          <p className="text-lg text-gray-300 mb-8">It's time to:</p>
          <div className="relative mx-auto mb-4 w-16 h-16">
            <img src={logo} alt="Schedularr Logo" className="w-full h-full transition-transform duration-300 hover:scale-125" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 className="mb-2 text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
            Schedularr
          </h1>
          <div className="relative left-1/2 transform -translate-x-1/2 w-full max-w-[300px] text-lg mb-8">
            <RandomEnding className="relative left-1/2 transform -translate-x-1/2 w-full max-w-[300px]" />
          </div>
          <button
            className="gsi-material-button mx-auto py-3 px-6 mb-2 mr-2 transition-grow duration-300 p-1"
            onClick={handleSignIn}
            style={{ cursor: 'pointer' }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">Sign in with Google</span>
              <span style={{ display: 'none' }}>Sign in with Google</span>
            </div>
          </button>
          <br />
          <div className="text-center">
            <p className="text-[10px] text-gray-400 opacity-70 mt-2">
              <a onClick={handleSkipLogin} className="text-blue-400 hover:underline cursor-pointer">- skip -</a>
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-4 flex flex-col items-center">
            <Tooltip message="I am tooltip 🚀" position="bottom">
              <p className="text-lg text-gray-300 mb-2">Welcome, {sanitize(userName)}!</p>
            </Tooltip>
            <h1 className="text-4xl font-extrabold flex items-center">
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Schedularr</span>
              <span className="relative w-8 h-8 ml-2">
                <img src={logo} alt="Schedularr Logo" className="w-full h-full" style={{ filter: 'brightness(0) invert(1)' }} />
              </span>
            </h1>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger tabValue="booking" value={activeTab} onValueChange={setActiveTab} variant="gradient" buttonGradient={buttonGradient}>
                <span className="material-icons mr-2 transition-transform duration-300 hover:scale-125 p-1">event</span> Booking
              </TabsTrigger>
              <TabsTrigger tabValue="settings" value={activeTab} onValueChange={setActiveTab} variant="gradientReverse" buttonGradient={buttonGradient}>
                <span className="material-icons mr-2 transition-transform duration-300 hover:scale-125 p-1">settings</span> Admin
              </TabsTrigger>
            </TabsList>
            <TabsContent tabValue="booking" value={activeTab}>
              <Card className="w-full max-w-[400px] mx-auto">
                <CardHeader>
                  <CardTitle inputGradient={inputGradient}>{sanitize(appTitle)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeError && (
                    <Alert
                      variant="destructive"
                      className="mb-4"
                      onDismiss={() => setTimeError('')}
                    >
                      {timeError}
                    </Alert>
                  )}
                  {submissionError && (
                    <Alert
                      variant="destructive"
                      className="mb-4"
                      onDismiss={() => setSubmissionError('')}
                    >
                      {submissionError}
                    </Alert>
                  )}
                  {showConfetti && (
                    <Alert
                      variant="success"
                      inputGradient={inputGradient}
                      className="mb-4"
                      onDismiss={() => setShowConfetti(false)}
                    >
                      Booking Sent! 🎉
                    </Alert>
                  )}
                  <div className="space-y-6">
                    <div className="relative flex items-center">
                      <Tooltip message="Event 🚀" position="bottom">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>public</span>
                      </Tooltip>
                      <Input
                        name="name"
                        value={event.name}
                        onChange={handleInputChange}
                        placeholder="Visiting Mars"
                        required
                        inputGradient={inputGradient}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400">*</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative flex items-center">
                        <Tooltip message="Event Date 📅" position="bottom">
                          <span className={cn(
                            "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                            inputGradient === 'yellow' ? 'text-yellow-400' :
                            inputGradient === 'purple' ? 'text-blue-400' :
                            inputGradient === 'cyan' ? 'text-green-400' :
                            inputGradient === 'grey' ? 'text-gray-400' :
                            inputGradient === 'orange' ? 'text-red-400' :
                            inputGradient === 'pink' ? 'text-pink-400' :
                            inputGradient === 'teal' ? 'text-teal-400' :
                            inputGradient === 'gold' ? 'text-amber-400' :
                            inputGradient === 'white' ? 'text-gray-600' :
                            'text-blue-400'
                          )}>event</span>
                        </Tooltip>
                        <Input
                          type="date"
                          name="startDate"
                          value={event.startDate}
                          onChange={handleInputChange}
                          required
                          inputGradient={inputGradient}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400">*</span>
                      </div>
                      <div className="relative flex items-center">
                        <Tooltip message="Event start time ⏱️" position="bottom">
                          <span className={cn(
                            "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                            inputGradient === 'yellow' ? 'text-yellow-400' :
                            inputGradient === 'purple' ? 'text-blue-400' :
                            inputGradient === 'cyan' ? 'text-green-400' :
                            inputGradient === 'grey' ? 'text-gray-400' :
                            inputGradient === 'orange' ? 'text-red-400' :
                            inputGradient === 'pink' ? 'text-pink-400' :
                            inputGradient === 'teal' ? 'text-teal-400' :
                            inputGradient === 'gold' ? 'text-amber-400' :
                            inputGradient === 'white' ? 'text-gray-600' :
                            'text-blue-400'
                          )}>access_time</span>
                        </Tooltip>
                        <Input
                          type="time"
                          name="startTime"
                          value={event.startTime}
                          onChange={handleInputChange}
                          step="900"
                          required
                          inputGradient={inputGradient}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400">*</span>
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <Tooltip message="How long is event ⏳" position="bottom">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>hourglass_empty</span>
                      </Tooltip>
                      <div className="relative w-full">
                        <Input
                          type="number"
                          name="duration"
                          value={event.duration}
                          onChange={handleInputChange}
                          placeholder="Duration"
                          step="0.5"
                          min="0.5"
                          required
                          className="pr-20"
                          inputGradient={inputGradient}
                        />
                        <span className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400">hrs</span>
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400">*</span>
                      </div>
                    </div>
                    <Divider inputGradient={inputGradient} label="Auto Calculated" />
                    <div className="flex items-center">
                      <Tooltip message="[auto] End time ⏰" position="bottom">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>event_available</span>
                      </Tooltip>
                      <div className="relative w-full">
                        <Input
                          type="text"
                          value={endTime}
                          readOnly
                          placeholder=""
                          className={cn("pr-12", endTime ? 'text-white' : 'text-gray-400')}
                          inputGradient={inputGradient}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">end</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Tooltip message="[auto] Currency & Fee 💰/🍰" position="bottom">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>account_balance_wallet</span>
                      </Tooltip>
                      <div className="flex items-center w-full gap-[2px]">
                        <Input
                          type="text"
                          value={currency}
                          readOnly
                          className="w-1/5 text-center cursor-pointer"
                          inputGradient={inputGradient}
                          onClick={() => setActiveTab('settings')}
                        />
                        <div className="relative w-4/5">
                          <Input
                            type="text"
                            value={cost || ''}
                            readOnly
                            className={cn("pr-12 cursor-pointer", cost ? 'text-white' : 'text-gray-400')}
                            inputGradient={inputGradient}
                            onClick={() => setActiveTab('settings')}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">fee</span>
                        </div>
                      </div>
                    </div>
                    <Divider inputGradient={inputGradient} label="Notes" />
                    <div className="flex items-center">
                      <Tooltip message="Notes 📝" position="bottom">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>edit</span>
                      </Tooltip>
                      <Input
                        name="note"
                        value={event.note}
                        onChange={handleInputChange}
                        placeholder="Bring Snacks"
                        maxLength="20"
                        inputGradient={inputGradient}
                      />
                    </div>
                  </div>
                  {(event.name && event.startDate && event.startTime && event.duration && endTime && !timeError) || devMode ? (
                    <Button
                      variant="gradient"
                      className="mt-8 w-full py-4 text-xl font-semibold flex items-center justify-center"
                      onClick={handleSubmit}
                      buttonGradient={buttonGradient}
                    >
                      Submit Booking 📅
                    </Button>
                  ) : null}
                  {submissionOutput && devMode && (
                    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg text-sm text-gray-300 whitespace-pre-wrap border border-gray-600">
                      {submissionOutput}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="settings" value={activeTab}>
              <Card className="w-full max-w-[400px] mx-auto">
                <CardHeader>
                  <CardTitle inputGradient={inputGradient}>Ad Astra</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <Button
                        variant="share"
                        className="w-full py-2 px-4 text-lg font-semibold"
                        onClick={() => setShowGuide(!showGuide)}
                        buttonGradient={buttonGradient}
                      >
                        How To Guide
                      </Button>
                      {showGuide && (
                        <div className="text-sm text-gray-300 bg-gray-700/50 p-4 rounded-lg mt-2 text-left">
                          <p className="mb-2">
                            Schedularr uses your Google account to create a new Google Calendar that you can invite people to, making it super easy to send quick bookings between people. This is useful for arranging care of the elderly, childcare, pet sitting, chores, trades between friends, and more.
                          </p>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>Sign in with Google.</li>
                            <li>Click “Create Schedularr Calendar” below or let the app create it automatically. Alternatively, enter an existing calendar ID.</li>
                            <li>Share the calendar with others by entering their email below.</li>
                            <li>Submit a booking: Fill out the Booking tab, click “Submit Booking 📅”, and the event will be added to the specified calendar.</li>
                            <li>If the event doesn’t appear, check:
                              <ul className="list-disc pl-5 mt-1">
                                <li>The calendar is shared with your account.</li>
                                <li>Console errors (F12 → Console) and share them.</li>
                              </ul>
                            </li>
                          </ol>
                          <p className="mt-2">For help, visit <a href="https://support.google.com/calendar/answer/37082" target="_blank" className="text-blue-400 underline">Google Calendar Help</a> or <a href="https://developers.google.com/identity" target="_blank" className="text-blue-400 underline">Google Identity Docs</a>.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === 'yellow' ? 'text-yellow-400' :
                        inputGradient === 'purple' ? 'text-blue-400' :
                        inputGradient === 'cyan' ? 'text-green-400' :
                        inputGradient === 'grey' ? 'text-gray-400' :
                        inputGradient === 'orange' ? 'text-red-400' :
                        inputGradient === 'pink' ? 'text-pink-400' :
                        inputGradient === 'teal' ? 'text-teal-400' :
                        inputGradient === 'gold' ? 'text-amber-400' :
                        inputGradient === 'white' ? 'text-gray-600' :
                        'text-blue-400'
                      )}>font_download</span>
                      <Input
                        value={appTitle}
                        onChange={handleAppTitleChange}
                        placeholder="A Grande Day Out"
                        inputGradient={inputGradient}
                      />
                    </div>

                    <Divider inputGradient={inputGradient} label="Calendar & Sharing" />

                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === 'yellow' ? 'text-yellow-400' :
                        inputGradient === 'purple' ? 'text-blue-400' :
                        inputGradient === 'cyan' ? 'text-green-400' :
                        inputGradient === 'grey' ? 'text-gray-400' :
                        inputGradient === 'orange' ? 'text-red-400' :
                        inputGradient === 'pink' ? 'text-pink-400' :
                        inputGradient === 'teal' ? 'text-teal-400' :
                        inputGradient === 'gold' ? 'text-amber-400' :
                        inputGradient === 'white' ? 'text-gray-600' :
                        'text-blue-400'
                      )}>calendar_today</span>
                      {calendarId ? (
                        <div className="flex items-center gap-x-4">
                          <p className="text-white cursor-pointer hover:underline" onClick={openCalendarLink}>{sanitize(calendarName)}</p>
                          <Button
                            variant="text"
                            className={cn(
                              "text-sm",
                              inputGradient === 'yellow' ? 'text-yellow-400 hover:text-yellow-300 focus:ring-yellow-500' :
                              inputGradient === 'cyan' ? 'text-green-400 hover:text-green-300 focus:ring-green-500' :
                              inputGradient === 'grey' ? 'text-gray-400 hover:text-gray-300 focus:ring-gray-500' :
                              inputGradient === 'orange' ? 'text-red-400 hover:text-red-300 focus:ring-red-500' :
                              inputGradient === 'pink' ? 'text-pink-400 hover:text-pink-300 focus:ring-pink-500' :
                              inputGradient === 'teal' ? 'text-teal-400 hover:text-teal-300 focus:ring-teal-500' :
                              inputGradient === 'gold' ? 'text-amber-400 hover:text-amber-300 focus:ring-amber-500' :
                              inputGradient === 'white' ? 'text-gray-600 hover:text-gray-500 focus:ring-gray-400' :
                              'text-blue-400 hover:text-blue-300 focus:ring-blue-500'
                            )}
                            onClick={() => {
                              setShowCalendarList(true);
                              setShowCustomCalendarInput(false);
                            }}
                            buttonGradient={buttonGradient}
                          >
                            Choose
                          </Button>
                          <Button
                            variant="text"
                            className={cn(
                              "text-sm",
                              inputGradient === 'yellow' ? 'text-yellow-400 hover:text-yellow-300 focus:ring-yellow-500' :
                              inputGradient === 'cyan' ? 'text-green-400 hover:text-green-300 focus:ring-green-500' :
                              inputGradient === 'grey' ? 'text-gray-400 hover:text-gray-300 focus:ring-gray-500' :
                              inputGradient === 'orange' ? 'text-red-400 hover:text-red-300 focus:ring-red-500' :
                              inputGradient === 'pink' ? 'text-pink-400 hover:text-pink-300 focus:ring-pink-500' :
                              inputGradient === 'teal' ? 'text-teal-400 hover:text-teal-300 focus:ring-teal-500' :
                              inputGradient === 'gold' ? 'text-amber-400 hover:text-amber-300 focus:ring-amber-500' :
                              inputGradient === 'white' ? 'text-gray-600 hover:text-gray-500 focus:ring-gray-400' :
                              'text-blue-400 hover:text-blue-300 focus:ring-blue-500'
                            )}
                            onClick={() => {
                              setShowCustomCalendarInput(true);
                              setShowCalendarList(false);
                            }}
                            buttonGradient={buttonGradient}
                          >
                            New Custom
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <Button
                            variant="gradient"
                            onClick={() => createSchedularrCalendar(accessToken, calendarName, 0, handleInvalidToken)
                              .then(id => {
                                setCalendarId(id);
                                localStorage.setItem('calendarId', id);
                                setSubmissionOutput(`${sanitize(calendarName)} calendar found or created successfully!`);
                              })
                              .catch(err => setSubmissionError(sanitize(err.message)))
                            }
                            className="mb-2 w-full"
                            buttonGradient={buttonGradient}
                          >
                            Create {sanitize(calendarName)} Calendar
                          </Button>
                          <p className="text-sm text-gray-400 mb-2">Or enter an existing Calendar ID:</p>
                          <Textarea
                            value={calendarId}
                            onChange={handleCalendarIdChange}
                            placeholder="e.g - abc123@group.calendar.google.com"
                            rows="2"
                            inputGradient={inputGradient}
                          />
                        </div>
                      )}
                    </div>
                    {showCustomCalendarInput && (
                      <div className="flex items-center mt-4">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>calendar_today</span>
                        <div className="w-full flex items-center gap-2">
                          <Input
                            value={customCalendarName}
                            onChange={handleCustomCalendarNameChange}
                            placeholder="Custom Calendar Name"
                            inputGradient={inputGradient}
                            className="flex-1"
                          />
                          <Button
                            variant="gradient"
                            onClick={handleCreateCustomCalendar}
                            className="py-2 px-4 text-lg font-semibold"
                            buttonGradient={buttonGradient}
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    )}
                    {showCalendarList && (
                      <div className="flex items-center mt-4">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>calendar_today</span>
                        <select
                          onChange={(e) => {
                            const selectedCalendar = calendarList.find(cal => cal.id === e.target.value);
                            if (selectedCalendar) handleCalendarSelect(selectedCalendar);
                          }}
                          className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105"
                        >
                          <option value="">Select a calendar...</option>
                          {calendarList.map(calendar => (
                            <option key={calendar.id} value={calendar.id}>{sanitize(calendar.summary)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === 'yellow' ? 'text-yellow-400' :
                        inputGradient === 'purple' ? 'text-blue-400' :
                        inputGradient === 'cyan' ? 'text-green-400' :
                        inputGradient === 'grey' ? 'text-gray-400' :
                        inputGradient === 'orange' ? 'text-red-400' :
                        inputGradient === 'pink' ? 'text-pink-400' :
                        inputGradient === 'teal' ? 'text-teal-400' :
                        inputGradient === 'gold' ? 'text-amber-400' :
                        inputGradient === 'white' ? 'text-gray-600' :
                        'text-blue-400'
                      )}>share</span>
                      <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                        <Input
                          value={shareEmail}
                          onChange={handleShareEmailChange}
                          placeholder="Email"
                          inputGradient={inputGradient}
                          className="flex-1"
                        />
                        <Button
                          variant="share"
                          buttonGradient={buttonGradient}
                          onClick={handleShareCalendar}
                          disabled={!shareEmail || !validateEmail(shareEmail)}
                          className="w-full sm:w-auto py-2 px-4 text-lg font-semibold"
                        >
                          Invite
                        </Button>
                      </div>
                    </div>
                    {sharedUsers.length > 0 && (
                      <div className="flex items-center">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'purple' ? 'text-blue-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>person</span>
                        <p className={cn(
                          "text-sm",
                          inputGradient === 'yellow' ? 'text-yellow-400' :
                          inputGradient === 'cyan' ? 'text-green-400' :
                          inputGradient === 'grey' ? 'text-gray-400' :
                          inputGradient === 'orange' ? 'text-red-400' :
                          inputGradient === 'pink' ? 'text-pink-400' :
                          inputGradient === 'teal' ? 'text-teal-400' :
                          inputGradient === 'gold' ? 'text-amber-400' :
                          inputGradient === 'white' ? 'text-gray-600' :
                          'text-blue-400'
                        )}>
                          <span className="font-bold">Shared with:</span> {sanitize(sharedUsers.join(', '))}
                        </p>
                      </div>
                    )}
                    {shareError && (
                      <Alert
                        variant="destructive"
                        className="mt-2"
                        onDismiss={() => setShareError('')}
                      >
                        {shareError}
                      </Alert>
                    )}
                    {shareSuccess && (
                      <Alert
                        variant="success"
                        inputGradient={inputGradient}
                        className="mt-2"
                        onDismiss={() => setShareSuccess('')}
                      >
                        {shareSuccess}
                      </Alert>
                    )}
                    <Divider inputGradient={inputGradient} label="Hourly Rate & Currency" />
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === 'yellow' ? 'text-yellow-400' :
                        inputGradient === 'purple' ? 'text-blue-400' :
                        inputGradient === 'cyan' ? 'text-green-400' :
                        inputGradient === 'grey' ? 'text-gray-400' :
                        inputGradient === 'orange' ? 'text-red-400' :
                        inputGradient === 'pink' ? 'text-pink-400' :
                        inputGradient === 'teal' ? 'text-teal-400' :
                        inputGradient === 'gold' ? 'text-amber-400' :
                        inputGradient === 'white' ? 'text-gray-600' :
                        'text-blue-400'
                      )}>account_balance_wallet</span>
                      <div className="relative w-full">
                        <Input
                          type="number"
                          value={hourlyRate}
                          onChange={handleHourlyRateChange}
                          placeholder="Fee per unit"
                          step="1"
                          min="0"
                          className="pl-10 pr-12 text-center custom-number-input"
                          inputGradient={inputGradient}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">/ hr</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === 'yellow' ? 'text-yellow-400' :
                        inputGradient === 'purple' ? 'text-blue-400' :
                        inputGradient === 'cyan' ? 'text-green-400' :
                        inputGradient === 'grey' ? 'text-gray-400' :
                        inputGradient === 'orange' ? 'text-red-400' :
                        inputGradient === 'pink' ? 'text-pink-400' :
                        inputGradient === 'teal' ? 'text-teal-400' :
                        inputGradient === 'gold' ? 'text-amber-400' :
                        inputGradient === 'white' ? 'text-gray-600' :
                        'text-blue-400'
                      )}>currency_exchange</span>
                      <div className="relative w-full">
                        <Input
                          value={currency}
                          onChange={handleCurrencyChange}
                          placeholder="Currency"
                          maxLength="3"
                          inputGradient={inputGradient}
                          className="pl-10 pr-12 text-center"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">£ $ 🍺</span>
                      </div>
                    </div>
                    <Divider inputGradient={inputGradient} label="Colour Themes" />
                    <ColourDropdown
                      value={inputGradient}
                      onChange={handleInputGradientChange}
                      icon="palette"
                      inputGradient={inputGradient}
                    />
                    <ColourDropdown
                      value={buttonGradient}
                      onChange={handleButtonGradientChange}
                      icon="radio_button_checked"
                      inputGradient={inputGradient}
                    />
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === 'yellow' ? 'text-yellow-400' :
                        inputGradient === 'purple' ? 'text-blue-400' :
                        inputGradient === 'cyan' ? 'text-green-400' :
                        inputGradient === 'grey' ? 'text-gray-400' :
                        inputGradient === 'orange' ? 'text-red-400' :
                        inputGradient === 'pink' ? 'text-pink-400' :
                        inputGradient === 'teal' ? 'text-teal-400' :
                        inputGradient === 'gold' ? 'text-amber-400' :
                        inputGradient === 'white' ? 'text-gray-600' :
                        'text-blue-400'
                      )}>settings</span>
                      <Button
                        variant="gradient"
                        onClick={handleDefaultColors}
                        className="w-full py-2 px-4 text-lg font-semibold"
                        buttonGradient={buttonGradient}
                      >
                        Default Colors
                      </Button>
                    </div>
                    <Divider inputGradient={inputGradient} label="<Dev> Mode" />
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === 'yellow' ? 'text-yellow-400' :
                        inputGradient === 'purple' ? 'text-blue-400' :
                        inputGradient === 'cyan' ? 'text-green-400' :
                        inputGradient === 'grey' ? 'text-gray-400' :
                        inputGradient === 'orange' ? 'text-red-400' :
                        inputGradient === 'pink' ? 'text-pink-400' :
                        inputGradient === 'teal' ? 'text-teal-400' :
                        inputGradient === 'gold' ? 'text-amber-400' :
                        inputGradient === 'white' ? 'text-gray-600' :
                        'text-blue-400'
                      )}>code</span>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={devMode}
                          onChange={handleDevModeChange}
                          className="mr-2 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-white">{`Enable Dev Mode (${VERSION})`}</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <Button
            onClick={toggleCalendar}
            variant="gradient"
            className="w-full max-w-[400px] py-3 text-base font-semibold flex items-center justify-center mt-6 mx-auto"
            buttonGradient={buttonGradient}
          >
            <span className="material-icons mr-2 transition-transform duration-300 hover:scale-125 p-1">calendar_view_day</span>
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </Button>
          {showCalendar && (
            <div className="mt-8 w-full max-w-[400px] mx-auto">
              {calendarId ? (
                <iframe
                  key={calendarKey}
                  src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(sanitize(calendarId))}&ctz=UTC`}
                  style={{ border: 0 }}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  scrolling="no"
                  className="rounded-xl shadow-2xl border border-gray-700 max-w-full"
                />
              ) : (
                <Alert variant="destructive">No calendar selected. Please create or enter a calendar ID in the Admin tab.</Alert>
              )}
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="text"
            className="w-full max-w-[400px] py-2 text-base font-semibold flex items-center justify-center mt-2 mx-auto"
            buttonGradient={buttonGradient}
          >
            <span className="material-icons mr-2 transition-transform duration-300 hover:scale-125 p-1">logout</span> Logout
          </Button>
          <div className="text-center mt-4">
            <p className="text-[10px] text-gray-400 opacity-70">
              <a href="https://ed-stone.co.uk" target="_blank" className="text-blue-400 hover:underline">- made by ed stone -</a>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default App;