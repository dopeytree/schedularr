import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { loadFileData } from './utils/loadFileData';

// Utility function for class names (Shadcn UI dependency, simplified without tailwind-merge)
const cn = (...args) => clsx(...args);

// Shadcn UI Input Component (adapted)
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

// Shadcn UI Button Component (adapted)
const Button = ({ className, variant = "default", ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    gradient: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
  };
  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
};

// Shadcn UI Card Components (adapted)
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

// Shadcn UI Alert Component (adapted)
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

// Shadcn UI Tabs Component (adapted without Radix UI dependency)
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
const TabsTrigger = ({ value, onValueChange, tabValue, className, ...props }) => (
  <button
    className={cn(
      "flex-1 py-3 text-lg font-semibold transition-all duration-300 flex items-center justify-center",
      value === tabValue ? "bg-indigo-800 text-cyan-300" : "bg-gray-700 text-gray-400 hover:bg-gray-600",
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
    return localStorage.getItem('whoWhat') || 'Grandad Care';
  });
  const [calendarId, setCalendarId] = useState(() => {
    return localStorage.getItem('calendarId') || '';
  });
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem('clientId') || '';
  });
  const [cost, setCost] = useState(0);
  const [activeTab, setActiveTab] = useState('booking');
  const [showCalendar, setShowCalendar] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [calendarIdError, setCalendarIdError] = useState('');
  const [clientIdError, setClientIdError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submissionOutput, setSubmissionOutput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Initialize Google API client
  useEffect(() => {
    if (!validateClientId(clientId)) {
      setClientIdError('Please enter a valid OAuth Client ID in Settings.');
      return;
    }
    if (!window.gapi || !window.gapi.load) {
      setClientIdError('Google API client failed to load. Please check your network connection and try again.');
      console.error('Google API client script not loaded.');
      return;
    }
    window.gapi.load('client', () => {
      window.gapi.client.init({
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      }).then(() => {
        console.log('GAPI client initialized successfully.');
      }).catch(err => {
        setClientIdError('Failed to initialize Google API client. Check Client ID or API setup.');
        console.error('GAPI init error:', err);
      });
    });
  }, [clientId]);

  // Handle Google sign-in
  useEffect(() => {
    if (!validateClientId(clientId)) return;
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setSubmissionError('Google Sign-In client failed to load. Please check your network connection and try again.');
      console.error('Google Sign-In client script not loaded.');
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
      callback: (response) => {
        if (response.error) {
          setSubmissionError(`Google sign-in failed: ${response.error}`);
          console.error('Sign-in error:', response);
          return;
        }
        setAccessToken(response.access_token);
        setIsSignedIn(true);
        fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        })
          .then(res => res.json())
          .then(data => {
            setUserEmail(data.email);
            console.log('User signed in:', data.email);
          })
          .catch(err => {
            console.error('User info error:', err);
          });
      },
    });
    tokenClient.requestAccessToken();
  }, [clientId]);

  // Validate 15-minute increments for startTime
  const validateTime = (time) => {
    if (!time) return false;
    const minutes = parseInt(time.split(':')[1], 10);
    return [0, 15, 30, 45].includes(minutes);
  };

  // Validate Calendar ID
  const validateCalendarId = (id) => {
    if (!id) return false;
    const regex = /^[a-zA-Z0-9._%+-]+@group\.calendar\.google\.com$/;
    return regex.test(id);
  };

  // Validate Client ID
  const validateClientId = (id) => {
    if (!id) return false;
    return id.includes('.apps.googleusercontent.com');
  };

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('hourlyRate', hourlyRate);
    localStorage.setItem('whoWhat', whoWhat);
    localStorage.setItem('calendarId', calendarId);
    localStorage.setItem('clientId', clientId);
  }, [hourlyRate, whoWhat, calendarId, clientId]);

  // Auto-calculate end time, end date, and cost
  useEffect(() => {
    if (event.startDate && event.startTime && event.duration) {
      if (!validateTime(event.startTime)) {
        setTimeError('Start time must be in 15-minute increments (00, 15, 30, 45).');
        return;
      }
      setTimeError('');

      // Expect event.startDate in YYYY-MM-DD format from <input type="date">
      const [year, month, day] = event.startDate.split('-');
      const isoDate = `${year}-${month}-${day}`; // Already in YYYY-MM-DD format
      const start = new Date(`${isoDate}T${event.startTime}`);
      
      if (isNaN(start.getTime())) {
        console.error('Invalid date format:', `${isoDate}T${event.startTime}`);
        setTimeError('Invalid date or time format. Please ensure date is in YYYY-MM-DD and time is in HH:MM.');
        return;
      }

      const durationMs = parseFloat(event.duration) * 60 * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      const calculatedEndDate = end.toISOString().split('T')[0];
      const calculatedEndTime = end.toTimeString().slice(0, 5);

      setEndTime(calculatedEndTime);
      setEndDate(calculatedEndDate);

      const calculatedCost = (parseFloat(event.duration) * hourlyRate).toFixed(2);
      setCost(calculatedCost);
    } else {
      setEndTime('');
      setEndDate('');
      setCost(0);
      setTimeError('');
    }
  }, [event.startDate, event.startTime, event.duration, hourlyRate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Convert YYYY-MM-DD to DD/MM/YYYY for display purposes
    if (name === 'startDate' && value) {
      const [year, month, day] = value.split('-');
      formattedValue = `${day}/${month}/${year}`;
    }

    setEvent({ ...event, [name]: formattedValue });
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

  const handleClientIdChange = (e) => {
    const id = e.target.value;
    setClientId(id);
    if (!validateClientId(id) && id) {
      setClientIdError('Invalid Client ID. It should look like 12345-abc.apps.googleusercontent.com');
    } else {
      setClientIdError('');
    }
  };

  const handleSignIn = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setSubmissionError('Google Sign-In client failed to load. Please check your network connection and try again.');
      console.error('Google Sign-In client script not loaded.');
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
      callback: (response) => {
        if (response.error) {
          setSubmissionError(`Google sign-in failed: ${response.error}`);
          console.error('Sign-in error:', response);
          return;
        }
        setAccessToken(response.access_token);
        setIsSignedIn(true);
        fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        })
          .then(res => res.json())
          .then(data => {
            setUserEmail(data.email);
            console.log('User signed in:', data.email);
          })
          .catch(err => {
            console.error('User info error:', err);
          });
      },
    });
    tokenClient.requestAccessToken();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError('');
    setSubmissionOutput('');

    // Validate inputs
    const errors = [];
    if (!isSignedIn) errors.push('Please sign in with Google.');
    if (!event.name) errors.push('Session Title is required.');
    if (!event.startDate) errors.push('Start Date is required.');
    if (!event.startTime) errors.push('Start Time is required.');
    else if (!validateTime(event.startTime)) errors.push('Start Time must be in 15-minute increments (00, 15, 30, 45).');
    if (!event.duration || event.duration <= 0) errors.push('Duration must be a positive number (minimum 0.25 hours).');
    if (!validateCalendarId(calendarId)) errors.push('A valid Google Calendar ID is required in Settings.');
    if (!validateClientId(clientId)) errors.push('A valid OAuth Client ID is required in Settings.');

    // Convert DD/MM/YYYY back to YYYY-MM-DD for API submission
    const [day, month, year] = event.startDate.split('/');
    const apiStartDate = `${year}-${month}-${day}`;

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
    if (errors.length === 0) {
      try {
        const eventData = {
          summary: event.name,
          start: {
            dateTime: `${apiStartDate}T${event.startTime}:00Z`,
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
        errors.push(`Failed to create event: ${err.message}`);
      }
    }

    const output = `Submission attempted:
Raw Data: ${JSON.stringify(submissionData, null, 2)}
API Response: ${apiResponse}
Note: Ensure you're signed into Google Calendar with the correct account.
Status: ${errors.length > 0 ? 'Failed due to errors' : 'Event sent to Google Calendar'}`;

    setSubmissionOutput(output);

    if (errors.length > 0) {
      setSubmissionError(errors.join(' '));
      return;
    }

    console.log('Submitting event to Google Calendar:', JSON.stringify(submissionData, null, 2));

    // Trigger confetti if available
    if (typeof confetti !== 'undefined') {
      setShowConfetti(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#3b82f6', '#ec4899'],
        duration: 3000,
      });
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      console.warn('Confetti library not loaded; skipping animation.');
    }

    // Reset form
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

  return (
    <div className="max-w-2xl w-full mx-auto p-6 sm:p-8">
      {!isSignedIn && (
        <Card className="mb-8">
          <CardContent className="text-center">
            <Button
              onClick={handleSignIn}
              variant="gradient"
              className="py-3 px-6 text-lg font-semibold flex items-center justify-center mx-auto"
            >
              <span className="material-icons mr-2">login</span> Sign in with Google
            </Button>
            <p className="text-sm text-gray-400 mt-3">Sign in to schedule events with Google Calendar.</p>
          </CardContent>
        </Card>
      )}
      <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        {whoWhat ? `${whoWhat} - Scheduler 📅` : 'Scheduler 📅'}
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger tabValue="booking" value={activeTab} onValueChange={setActiveTab}>
            <span className="material-icons mr-2">event</span> Booking
          </TabsTrigger>
          <TabsTrigger tabValue="settings" value={activeTab} onValueChange={setActiveTab}>
            <span className="material-icons mr-2">settings</span> Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent tabValue="booking" value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Schedule Care Session</CardTitle>
            </CardHeader>
            <CardContent>
              {timeError && (
                <Alert variant="destructive" className="mb-4">{timeError}</Alert>
              )}
              {submissionError && (
                <Alert variant="destructive" className="mb-4">{submissionError}</Alert>
              )}
              {showConfetti && (
                <Alert variant="success" className="mb-4 text-center">Booking Confirmed! 🎉</Alert>
              )}
              <div className="space-y-6">
                <div className="flex items-center">
                  <span className="material-icons text-blue-400 mr-3">title</span>
                  <Input
                    name="name"
                    value={event.name}
                    onChange={handleInputChange}
                    placeholder="Care Session Title"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <span className="material-icons text-blue-400 mr-3">calendar_today</span>
                    <Input
                      type="date"
                      name="startDate"
                      value={event.startDate ? event.startDate.split('/').reverse().join('-') : ''}
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
                  <Input
                    type="number"
                    name="duration"
                    value={event.duration}
                    onChange={handleInputChange}
                    placeholder="Duration (hours)"
                    step="0.25"
                    min="0.25"
                    required
                  />
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

              {event.name && event.startDate && event.startTime && event.duration && endTime && !timeError && (
                <Button
                  variant="gradient"
                  className="mt-8 w-full py-4 text-xl font-semibold flex items-center justify-center"
                  onClick={handleSubmit}
                >
                  Submit Booking 📅
                </Button>
              )}

              {submissionOutput && (
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
              <CardTitle>Settings ⚙️</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center">
                  <span className="material-icons text-blue-400 mr-3">person</span>
                  <Input
                    value={whoWhat}
                    onChange={handleWhoWhatChange}
                    placeholder="Who/What (e.g., Grandad Care)"
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
                  <span className="material-icons text-blue-400 mr-3">calendar</span>
                  <Input
                    value={calendarId}
                    onChange={handleCalendarIdChange}
                    placeholder="Google Calendar ID (e.g., abc123@group.calendar.google.com)"
                  />
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-blue-400 mr-3">key</span>
                  <Input
                    value={clientId}
                    onChange={handleClientIdChange}
                    placeholder="OAuth Client ID (e.g., 12345-abc.apps.googleusercontent.com)"
                  />
                </div>
                {calendarIdError && (
                  <Alert variant="destructive">{calendarIdError}</Alert>
                )}
                {clientIdError && (
                  <Alert variant="destructive">{clientIdError}</Alert>
                )}
                <div className="text-sm text-gray-300 bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-cyan-300">Setup Instructions</h3>
                  <p className="mb-2">To use this app with Google Calendar:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Create a Google Cloud project at <a href="https://console.cloud.google.com" target="_blank" className="text-blue-400 underline">console.cloud.google.com</a>.</li>
                    <li>Enable Google Calendar API in “APIs & Services” > “Library”.</li>
                    <li>Configure OAuth consent screen: Set user type to “External”, add scope for calendar.events, and provide app name/support email.</li>
                    <li>Create OAuth 2.0 Client ID: Select “Web application”, add origins (e.g., http://localhost:8080, your hosted URL), and copy the Client ID.</li>
                    <li>Paste the Client ID into the “OAuth Client ID” field above.</li>
                    <li>Create a shared calendar: Sign into <a href="https://calendar.google.com" target="_blank" className="text-blue-400 underline">calendar.google.com</a>, click “+” next to “Other calendars”, create a calendar (e.g., “Grandad Care Calendar”), and share it with users (e.g., yourself, caregiver) with “Make changes to events” permissions.</li>
                    <li>Get the Calendar ID: In calendar settings, under “Integrate calendar”, copy the ID (e.g., abc123@group.calendar.google.com) and paste it into the “Google Calendar ID” field.</li>
                    <li>Submit a booking: Fill out the Booking tab, click “Submit Booking 📅”, and the event will be added to the specified calendar.</li>
                    <li>If the event doesn’t appear, check:
                      <ul className="list-disc pl-5 mt-1">
                        <li>The Client ID and Calendar ID are correct.</li>
                        <li>The calendar is shared with your account.</li>
                        <li>Pop-up blockers are disabled.</li>
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
    </div>
  );
};

export default App;