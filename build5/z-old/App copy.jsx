import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import logo from './assets/logo.svg';
import { emojiBlast } from "emoji-blast";

// Utility function for class names
const cn = (...args) => clsx(...args);

// Utility function to generate random string for PKCE
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Utility function to generate code challenge from code verifier
const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
};

// Shadcn UI Components
const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900",
        className
      )}
      {...props}
    />
  );
};

const Button = ({ className, variant = "default", ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    gradient: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
    gradientReverse: "bg-gradient-to-l from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
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
  <div className={cn("p-6 sm:p-8", className)} {...props} />
);
const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-2xl font-semibold text-cyan-300", className)} {...props} />
);
const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 sm:p-8 pt-0", className)} {...props} />
);

const Alert = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-gray-700/80 text-gray-300 border-gray-600",
    destructive: "bg-red-900/50 text-red-400 border-red-600 animate-pulse",
    success: "bg-green-900/50 text-green-400 border-green-600 animate-bounce",
  };
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

const Tabs = ({ value, onValueChange, children }) => {
  return (
    <div>
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  );
};
const TabsList = ({ className, ...props }) => (
  <div
    className={cn(
      "flex bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 shadow-lg",
      className
    )}
    {...props}
  />
);
const TabsTrigger = ({ value, onValueChange, tabValue, className, variant = "gradient", ...props }) => (
  <button
    className={cn(
      "flex-1 py-3 px-6 text-lg font-semibold flex items-center justify-center transition-all duration-300",
      variant === "gradient" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105" : "",
      variant === "gradientReverse" ? "bg-gradient-to-l from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105" : "",
      value === tabValue ? "bg-indigo-800 text-cyan-300" : "",
      className
    )}
    onClick={() => onValueChange(tabValue)}
    {...props}
  />
);
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
  // Hardcoded OAuth Client ID
  const CLIENT_ID = '32569943087-v0hk6vf7krtq1b2v5e1okhp0v5jqeih1.apps.googleusercontent.com';

  const [event, setEvent] = useState({
    name: '',
    startDate: '',
    startTime: '',
    duration: '',
  });
  const [endTime, setEndTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState(() => {
    return localStorage.getItem('hourlyRate') ? parseFloat(localStorage.getItem('hourlyRate')) : 20;
  });
  const [whoWhat, setWhoWhat] = useState(() => {
    return localStorage.getItem('whoWhat') || 'A Grande Day Out';
  });
  const [calendarId, setCalendarId] = useState(() => {
    return localStorage.getItem('calendarId') || '';
  });
  const [cost, setCost] = useState(0);
  const [activeTab, setActiveTab] = useState('booking');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [timeError, setTimeError] = useState('');
  const [calendarIdError, setCalendarIdError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submissionOutput, setSubmissionOutput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('isSignedIn') === 'true';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail') || '';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('accessToken') || '';
  });
  const [devMode, setDevMode] = useState(() => {
    return localStorage.getItem('devMode') === 'true';
  });

  // PKCE state
  const [codeVerifier, setCodeVerifier] = useState(() => {
    return localStorage.getItem('codeVerifier') || '';
  });
  const [state, setState] = useState(() => {
    return localStorage.getItem('oauthState') || '';
  });

  // Persist PKCE state
  useEffect(() => {
    if (codeVerifier) {
      localStorage.setItem('codeVerifier', codeVerifier);
    } else {
      localStorage.removeItem('codeVerifier');
    }
    if (state) {
      localStorage.setItem('oauthState', state);
    } else {
      localStorage.removeItem('oauthState');
    }
  }, [codeVerifier, state]);

  // Persist authentication state
  useEffect(() => {
    localStorage.setItem('isSignedIn', isSignedIn);
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userName', userName);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('hourlyRate', hourlyRate);
    localStorage.setItem('whoWhat', whoWhat);
    localStorage.setItem('calendarId', calendarId);
    localStorage.setItem('devMode', devMode);
  }, [isSignedIn, userEmail, userName, accessToken, hourlyRate, whoWhat, calendarId, devMode]);

  // Initialize Google API client
  useEffect(() => {
    if (!window.gapi || !window.gapi.load) {
      setSubmissionError('Google API client failed to load. Please check your network connection and try again.');
      console.error('Google API client script not loaded.');
      return;
    }
    window.gapi.load('client', () => {
      window.gapi.client.init({
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      }).then(() => {
        console.log('GAPI client initialized successfully.');
      }).catch(err => {
        setSubmissionError('Failed to initialize Google API client. Check API setup.');
        console.error('GAPI init error:', err);
      });
    });
  }, []);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const stateParam = urlParams.get('state');
    const error = urlParams.get('error');

    console.log('OAuth redirect params:', { code, stateParam, error });

    if (error) {
      setSubmissionError(`OAuth error: ${error}`);
      console.error('OAuth error:', error);
      localStorage.removeItem('codeVerifier');
      localStorage.removeItem('oauthState');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const storedState = localStorage.getItem('oauthState') || '';
    if (code && stateParam && stateParam === storedState) {
      console.log('Valid code and state received, exchanging code...');
      exchangeCodeForTokens(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code && stateParam !== storedState) {
      console.error('State mismatch:', { stateParam, storedState });
      setSubmissionError('OAuth state mismatch. Please try signing in again.');
      localStorage.removeItem('codeVerifier');
      localStorage.removeItem('oauthState');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const exchangeCodeForTokens = async (code) => {
    try {
      const redirectUri = window.location.origin;
      const storedCodeVerifier = localStorage.getItem('codeVerifier') || codeVerifier;
      console.log('Exchanging code with:', { redirectUri, client_id: CLIENT_ID, codeVerifier: storedCodeVerifier });
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: storedCodeVerifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token exchange failed:', errorData);
        throw new Error(errorData.error_description || 'Failed to exchange code');
      }

      const data = await response.json();
      console.log('Token exchange successful:', data);
      setAccessToken(data.access_token);
      setIsSignedIn(true);

      const userResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error('User info fetch failed:', errorData);
        throw new Error('Failed to fetch user info');
      }
      const userData = await userResponse.json();
      setUserEmail(userData.email);
      setUserName(userData.name || userData.given_name || 'User');
      console.log('User signed in:', userData.email, 'Name:', userData.name);

      // Clear PKCE state
      setCodeVerifier('');
      setState('');
      localStorage.removeItem('codeVerifier');
      localStorage.removeItem('oauthState');
    } catch (err) {
      setSubmissionError(`Failed to exchange code: ${err.message}`);
      console.error('Token exchange error:', err);
      localStorage.removeItem('codeVerifier');
      localStorage.removeItem('oauthState');
    }
  };

  // Handle Google sign-in
  const handleSignIn = async () => {
    const newCodeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(newCodeVerifier);
    const newState = generateRandomString(32);

    setCodeVerifier(newCodeVerifier);
    setState(newState);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', window.location.origin);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('state', newState);
    authUrl.searchParams.append('prompt', 'select_account');

    console.log('Initiating OAuth with redirect_uri:', window.location.origin, 'authUrl:', authUrl.toString());
    window.location.assign(authUrl.toString());
  };

  // Handle Skip Login for testing
  const handleSkipLogin = () => {
    setIsSignedIn(true);
    setUserName('Test User');
    setUserEmail('test@example.com');
    setAccessToken('dummy-access-token');
    setDevMode(true);
    setActiveTab('settings');
    console.log('Skipped login for testing, enabled dev mode');
  };

  // Rocket animation
  useEffect(() => {
    if (!isSignedIn) {
      const blastYPos = window.innerHeight - 10;
      const rocket = () => {
        emojiBlast({
          emojiCount: 1,
          emojis: ["🚀"],
          physics: {
            fontSize: 45,
            gravity: 0,
            initialVelocities: {
              x: 12,
              y: -10
            },
            rotation: 0,
            rotationDeceleration: 0
          },
          position: {
            x: 0,
            y: blastYPos
          }
        });
      };
      const clouds = () => {
        emojiBlast({
          emojiCount: 10,
          emojis: ["☁️"],
          physics: {
            fontSize: { max: 50, min: 38 },
            gravity: 0.1,
            initialVelocities: {
              x: { max: 7, min: -7 },
              y: { max: -2, min: -5 }
            },
            rotation: 0,
            rotationDeceleration: 0
          },
          position: {
            x: 0,
            y: blastYPos
          }
        });
      };
      const sparkles = () => {
        emojiBlast({
          emojiCount: 10,
          emojis: ["✨"],
          physics: {
            fontSize: { max: 30, min: 10 },
            gravity: 0.2,
            initialVelocities: {
              x: { max: 20, min: -15 },
              y: { max: 20, min: -15 }
            },
          },
          position: {
            x: 50,
            y: blastYPos - 60
          }
        });
      };
      rocket();
      clouds();
      setTimeout(sparkles, 400);
    }
  }, [isSignedIn]);

  // Validation functions
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

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEvent({ ...event, [name]: value });
    setSubmissionError('');
    setSubmissionOutput('');
  };

  const handleHourlyRateChange = (e) => {
    const value = e.target.value;
    const rate = value ? parseFloat(value) : 0;
    setHourlyRate(rate);
  };

  const handleWhoWhatChange = (e) => {
    setWhoWhat(e.target.value);
  };

  const handleCalendarIdChange = (e) => {
    const id = e.target.value;
    setCalendarId(id);
    if (!validateCalendarId(id) && id) {
      setCalendarIdError('Invalid Calendar ID. It should look like abc123@group.calendar.google.com');
    } else {
      setCalendarIdError('');
    }
  };

  const handleDevModeChange = (e) => {
    setDevMode(e.target.checked);
  };

  // Submit event
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
      if (!event.duration || event.duration <= 0) errors.push('Duration must be a positive number (minimum 0.25 hours).');
      if (!validateCalendarId(calendarId)) errors.push('A valid Google Calendar ID is required in Settings.');
    }
    const submissionData = {
      name: event.name || 'N/A',
      startDate: event.startDate || 'N/A',
      startTime: event.startTime || 'N/A',
      endDate: endDate || 'N/A',
      endTime: endTime || 'N/A',
      calendarId: calendarId || 'N/A',
      userEmail: userEmail || 'Not signed in',
    };
    let apiResponse = 'N/A';
    if (errors.length === 0 || devMode) {
      try {
        const eventData = {
          summary: event.name || 'Test Event',
          description: `Duration: ${event.duration} hours\nCost: £${cost}`,
          start: {
            dateTime: `${event.startDate}T${event.startTime}:00Z`,
            timeZone: 'UTC',
          },
          end: {
            dateTime: `${endDate}T${endTime}:00Z`,
            timeZone: 'UTC',
          },
        };
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error.message);
        }
        const result = await response.json();
        apiResponse = `Event created: ${result.htmlLink}`;
      } catch (err) {
        apiResponse = `Error: ${err.message}`;
        if (!devMode) {
          errors.push(`Failed to create event: ${err.message}`);
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
      return;
    }
    console.log('Submitting event to Google Calendar:', JSON.stringify(submissionData, null, 2));
    if (typeof confetti !== 'undefined') {
      setShowConfetti(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#3b82f6', '#ec4899'],
        duration: 3000,
      });
    } else {
      console.warn('Confetti library not loaded; skipping animation.');
    }
    setCalendarKey(prevKey => prevKey + 1);
    setEvent({
      name: '',
      startDate: '',
      startTime: '',
      duration: '',
    });
    setEndTime('');
    setEndDate('');
    setCost(0);
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Render
  return (
    <div className="max-w-2xl w-full mx-auto p-6 sm:p-8">
      {submissionError && (
        <Alert variant="destructive" className="mb-4">{submissionError}</Alert>
      )}
      {!isSignedIn ? (
        <div className="text-center">
          <p className="text-lg text-gray-300 mb-4">Welcome!</p>
          <div className="relative mx-auto mb-4 w-16 h-16">
            <img src={logo} alt="Schedularr Logo" className="w-full h-full" style={{ filter: 'invert(0) brightness(8) sepia(10) hue-rotate(166deg) saturate(10)' }} />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
            Schedularr
          </h1>
          <p className="text-lg text-gray-300 mb-6">Helping You Book Life 🏝️</p>
          <Button
            onClick={handleSignIn}
            variant="gradient"
            className="py-3 px-6 text-lg font-semibold flex items-center justify-center mx-auto mb-4"
          >
            <span className="material-icons mr-2">login</span> Login with Google
          </Button>
          <p className="text-lg">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleSkipLogin();
              }}
              className="text-blue-400 hover:underline"
            >
              >
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="text-center mb-4 flex flex-col items-center">
            <p className="text-lg text-gray-300 mb-2">Welcome, {userName}!</p>
            <h1 className="text-4xl font-extrabold flex items-center">
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Schedularr</span>
              <span className="relative w-8 h-8 ml-2">
                <img src={logo} alt="Schedularr Logo" className="w-full h-full" style={{ filter: 'invert(0) brightness(8) sepia(10) hue-rotate(166deg) saturate(10)' }} />
              </span>
            </h1>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full max-w-[400px] mx-auto">
              <TabsTrigger tabValue="booking" value={activeTab} onValueChange={setActiveTab} variant="gradient">
                <span className="material-icons mr-2">event</span> Booking
              </TabsTrigger>
              <TabsTrigger tabValue="settings" value={activeTab} onValueChange={setActiveTab} variant="gradientReverse">
                <span className="material-icons mr-2">settings</span> Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent tabValue="booking" value={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle>{whoWhat}</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeError && (
                    <Alert variant="destructive" className="mb-4">{timeError}</Alert>
                  )}
                  {submissionError && (
                    <Alert variant="destructive" className="mb-4">{submissionError}</Alert>
                  )}
                  {showConfetti && (
                    <Alert variant="success" className="mb-4 text-center">Booking Sent! 🎉</Alert>
                  )}
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">title</span>
                      <Input
                        name="name"
                        value={event.name}
                        onChange={handleInputChange}
                        placeholder="Visiting Mars"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className="material-icons text-blue-400 mr-3">calendar_today</span>
                        <Input
                          type="date"
                          name="startDate"
                          value={event.startDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="material-icons text-blue-400 mr-3">access_time</span>
                        <Input
                          type="time"
                          name="startTime"
                          value={event.startTime}
                          onChange={handleInputChange}
                          step="900"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">hourglass_empty</span>
                      <div className="relative w-full">
                        <Input
                          type="number"
                          name="duration"
                          value={event.duration}
                          onChange={handleInputChange}
                          placeholder="Duration"
                          step="0.25"
                          min="0.25"
                          required
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">hrs</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">event_available</span>
                      <Input
                        type="text"
                        value={endTime}
                        readOnly
                        placeholder="End Time"
                        className={endTime ? 'text-white' : 'text-gray-400'}
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">wallet</span>
                      <Input
                        type="text"
                        value={cost ? `£${cost}` : ''}
                        readOnly
                        placeholder="Cost"
                        className={cost ? 'text-white' : 'text-gray-400'}
                      />
                    </div>
                  </div>
                  {(event.name && event.startDate && event.startTime && event.duration && endTime && !timeError) || devMode ? (
                    <Button
                      variant="gradient"
                      className="mt-8 w-full py-4 text-xl font-semibold flex items-center justify-center"
                      onClick={handleSubmit}
                    >
                      Submit Booking 📅
                    </Button>
                  ) : null}
                  {submissionOutput && devMode && (
                    <div className="mt-6 p-4 bg-gray-700/80 rounded-lg text-sm text-gray-300 whitespace-pre-wrap border border-gray-600">
                      {submissionOutput}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent tabValue="settings" value={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle>Settings Admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">person</span>
                      <Input
                        value={whoWhat}
                        onChange={handleWhoWhatChange}
                        placeholder="A Grande Day Out"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">wallet</span>
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">£</span>
                        <Input
                          type="number"
                          value={hourlyRate}
                          onChange={handleHourlyRateChange}
                          placeholder="Hourly Rate"
                          step="1"
                          min="0"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">calendar_today</span>
                      <Input
                        value={calendarId}
                        onChange={handleCalendarIdChange}
                        placeholder="Google Calendar ID (e.g., abc123@group.calendar.google.com)"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-blue-400 mr-3">code</span>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={devMode}
                          onChange={handleDevModeChange}
                          className="mr-2 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-white">Enable Dev Mode (bypass validations for testing)</span>
                      </label>
                    </div>
                    {calendarIdError && (
                      <Alert variant="destructive">{calendarIdError}</Alert>
                    )}
                    <div className="text-sm text-gray-300 bg-gray-700/50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 text-cyan-300">Admin Setup Instructions</h3>
                      <p className="mb-2">To use this app with Google Calendar:</p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Create a Google Cloud project at <a href="https://console.cloud.google.com" target="_blank" className="text-blue-400 underline">console.cloud.google.com</a>.</li>
                        <li>Enable Google Calendar API in “APIs & Services” > “Library”.</li>
                        <li>Configure OAuth consent screen: Set user type to “External”, add scopes for calendar.events, userinfo.email, and userinfo.profile, and provide app name/support email.</li>
                        <li>Create OAuth 2.0 Client ID: Select “Web application”, add JavaScript origins (https://schedularr.me) and redirect URIs (https://schedularr.me), and copy the Client ID.</li>
                        <li>Create a shared calendar: Sign into <a href="https://calendar.google.com" target="_blank" className="text-blue-400 underline">calendar.google.com</a>, click “+” next to “Other calendars”, create a calendar (e.g., “A Grande Day Out Calendar”), and share it with users (e.g., yourself, caregiver) with “Make changes to events” permissions.</li>
                        <li>Get the Calendar ID: In calendar settings, under “Integrate calendar”, copy the ID (e.g., abc123@group.calendar.google.com) and paste it into the “Google Calendar ID” field above.</li>
                        <li>Submit a booking: Fill out the Booking tab, click “Submit Booking 📅”, and the event will be added to the specified calendar.</li>
                        <li>If the event doesn’t appear, check:
                          <ul className="list-disc pl-5 mt-1">
                            <li>The Calendar ID is correct.</li>
                            <li>The calendar is shared with your account.</li>
                            <li>JavaScript origins and redirect URIs match https://schedularr.me.</li>
                            <li>Console errors (F12 → Console) and share them.</li>
                          </ul>
                        </li>
                      </ol>
                      <p className="mt-2">For help, visit <a href="https://support.google.com/calendar/answer/37082" target="_blank" className="text-blue-400 underline">Google Calendar Help</a> or <a href="https://developers.google.com/identity" target="_blank" className="text-blue-400 underline">Google Identity Docs</a>.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <Button
            onClick={toggleCalendar}
            className="w-full py-3 bg-gray-700/80 rounded-lg hover:bg-gray-600 transition-all duration-300 text-base font-semibold flex items-center justify-center mt-6 border border-gray-600"
          >
            <span className="material-icons mr-2">calendar_view_day</span>
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </Button>
          {showCalendar && (
            <div className="mt-8 w-full max-w-4xl">
              <iframe
                key={calendarKey}
                src={calendarId ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=UTC` : 'https://calendar.google.com/calendar/embed?src=&ctz=UTC'}
                style={{ border: 0 }}
                width="100%"
                height="400"
                frameborder="0"
                scrolling="no"
                className="rounded-xl shadow-2xl border border-gray-700"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;