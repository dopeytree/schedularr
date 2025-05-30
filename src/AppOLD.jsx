import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import logo from './assets/logo.svg';
import { emojiBlast } from "emoji-blast";
import RandomEnding from './components/Extra/RandomEnding.jsx'; // Import the RandomEnding component
import Tooltip from './components/Tooltip.jsx'; // Import the Tooltip component
import Divider from './components/divider.jsx/index.js'; // Import the Divider component
import ColourDropdown from './components/ColourDropdown.jsx'; // Import the ColourDropdown component
import { cn } from './utils/cn.jsx';

// Version number for the app
const VERSION = "v0.61";

export const logClassNames = (...args) => {
  const classNames = cn(...args);
  console.log('Generated class names:', classNames);
  return classNames;
};

const colorToGradientMap = {
  yellow: 'grey-yellow',
  purple: 'blue-purple',
  cyan: 'green-cyan',
  grey: 'dark-grey',
  orange: 'red-orange',
  pink: 'retro-pink',
  teal: 'retro-teal',
  gold: 'brown-gold',
  white: 'white-grey',
};


// Fetch user's calendar list
const fetchCalendarList = async (accessToken) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch calendar list');
    }
    const data = await response.json();
    return data.items;
  } catch (err) {
    console.error('Calendar list fetch error:', err);
    return [];
  }
};

// Find existing Schedularr calendar
const findSchedularrCalendar = async (accessToken, calendarName = 'Schedularr') => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch calendar list');
    }
    const data = await response.json();
    const schedularrCalendar = data.items.find(cal => cal.summary === calendarName);
    return schedularrCalendar ? schedularrCalendar.id : null;
  } catch (err) {
    console.error('Calendar list error:', err);
    return null;
  }
};

// Create new calendar with unique name
const createSchedularrCalendar = async (accessToken, calendarName = 'Schedularr', attempt = 0) => {
  try {
    // Check if calendar with the name already exists
    const existingId = await findSchedularrCalendar(accessToken, calendarName);
    if (existingId) {
      return existingId; // Return existing calendar ID if found
    }

    // Generate unique name if attempt > 0
    const uniqueName = attempt > 0 ? `${calendarName} ${attempt}` : calendarName;

    // Check if the unique name already exists
    const existingUniqueId = await findSchedularrCalendar(accessToken, uniqueName);
    if (existingUniqueId) {
      // If the name exists, try again with the next number
      return createSchedularrCalendar(accessToken, calendarName, attempt + 1);
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: uniqueName,
        description: `Calendar for ${uniqueName} bookings`,
        timeZone: 'UTC',
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create calendar');
    }
    const data = await response.json();
    console.log('Created calendar:', data);
    return data.id;
  } catch (err) {
    console.error('Calendar creation error:', err);
    throw new Error(`Failed to create calendar: ${err.message}`);
  }
};

// Share Schedularr calendar with an email
const shareSchedularrCalendar = async (calendarId, email, accessToken) => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'writer', // Grants "Make changes to events" permission
        scope: { type: 'user', value: email },
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Share calendar error response:', errorData);
      throw new Error(`Failed to share calendar: ${errorData.error.message}`);
    }
    return true;
  } catch (err) {
    console.error('Calendar sharing error:', err);
    throw new Error(`Failed to share calendar: ${err.message}`);
  }
};

// Fetch shared users for a calendar
const fetchSharedUsers = async (calendarId, accessToken) => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/acl`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch shared users');
    }
    const data = await response.json();
    return data.items
      .filter(item => item.scope.type === 'user' && item.scope.value)
      .map(item => item.scope.value)
      .filter(value => !value.endsWith('@group.calendar.google.com') && value.length < 50 && value.includes('@')); // Filter out calendar IDs and non-email-like entries
  } catch (err) {
    console.error('Fetch shared users error:', err);
    return [];
  }
};

// Shadcn UI Components with hover animations
const Input = ({ className, inputGradient, ...props }) => {
  const gradientStyles = {
    'grey-yellow': '0 0 10px rgba(128, 128, 128, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
    'blue-purple': '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.5)',
    'green-cyan': '0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(6, 182, 212, 0.5)',
    'dark-grey': '0 0 10px rgba(50, 50, 50, 0.5), 0 0 20px rgba(100, 100, 100, 0.5)',
    'red-orange': '0 0 10px rgba(255, 69, 0, 0.5), 0 0 20px rgba(255, 99, 71, 0.5)',
    'retro-pink': '0 0 10px rgba(255, 105, 180, 0.5), 0 0 20px rgba(148, 0, 211, 0.5)',
    'retro-teal': '0 0 10px rgba(0, 128, 128, 0.5), 0 0 20px rgba(64, 224, 208, 0.5)',
    'brown-gold': '0 0 10px rgba(139, 69, 19, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
    'white-grey': '0 0 10px rgba(245, 245, 220, 0.5), 0 0 20px rgba(128, 128, 128, 0.5)',
  };
  const hoverGradientStyles = {
    'grey-yellow': '0 0 15px rgba(128, 128, 128, 0.7), 0 0 25px rgba(255, 215, 0, 0.7)',
    'blue-purple': '0 0 15px rgba(59, 130, 246, 0.7), 0 0 25px rgba(139, 92, 246, 0.7)',
    'green-cyan': '0 0 15px rgba(34, 197, 94, 0.7), 0 0 25px rgba(6, 182, 212, 0.7)',
    'dark-grey': '0 0 15px rgba(50, 50, 50, 0.7), 0 0 25px rgba(100, 100, 100, 0.7)',
    'red-orange': '0 0 15px rgba(255, 69, 0, 0.7), 0 0 25px rgba(255, 99, 71, 0.7)',
    'retro-pink': '0 0 15px rgba(255, 105, 180, 0.7), 0 0 25px rgba(148, 0, 211, 0.7)',
    'retro-teal': '0 0 15px rgba(0, 128, 128, 0.7), 0 0 25px rgba(64, 224, 208, 0.7)',
    'brown-gold': '0 0 15px rgba(139, 69, 19, 0.7), 0 0 25px rgba(255, 215, 0, 0.7)',
    'white-grey': '0 0 15px rgba(245, 245, 220, 0.7), 0 0 25px rgba(128, 128, 128, 0.7)',
  };
  return (
    <div className="relative w-full">
      <input
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105",
          className
        )}
        style={{ boxShadow: gradientStyles[inputGradient] || gradientStyles['blue-purple'] }}
        onMouseEnter={(e) => e.target.style.boxShadow = hoverGradientStyles[inputGradient] || hoverGradientStyles['blue-purple']}
        onMouseLeave={(e) => e.target.style.boxShadow = gradientStyles[inputGradient] || gradientStyles['blue-purple']}
        {...props}
      />
    </div>
  );
};

const Textarea = ({ className, inputGradient, ...props }) => {
  const gradientStyles = {
    'grey-yellow': '0 0 10px rgba(128, 128, 128, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
    'blue-purple': '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.5)',
    'green-cyan': '0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(6, 182, 212, 0.5)',
    'dark-grey': '0 0 10px rgba(50, 50, 50, 0.5), 0 0 20px rgba(100, 100, 100, 0.5)',
    'red-orange': '0 0 10px rgba(255, 69, 0, 0.5), 0 0 20px rgba(255, 99, 71, 0.5)',
    'retro-pink': '0 0 10px rgba(255, 105, 180, 0.5), 0 0 20px rgba(148, 0, 211, 0.5)',
    'retro-teal': '0 0 10px rgba(0, 128, 128, 0.5), 0 0 20px rgba(64, 224, 208, 0.5)',
    'brown-gold': '0 0 10px rgba(139, 69, 19, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
    'white-grey': '0 0 10px rgba(245, 245, 220, 0.5), 0 0 20px rgba(128, 128, 128, 0.5)',
  };
  const hoverGradientStyles = {
    'grey-yellow': '0 0 15px rgba(128, 128, 128, 0.7), 0 0 25px rgba(255, 215, 0, 0.7)',
    'blue-purple': '0 0 15px rgba(59, 130, 246, 0.7), 0 0 25px rgba(139, 92, 246, 0.7)',
    'green-cyan': '0 0 15px rgba(34, 197, 94, 0.7), 0 0 25px rgba(6, 182, 212, 0.7)',
    'dark-grey': '0 0 15px rgba(50, 50, 50, 0.7), 0 0 25px rgba(100, 100, 100, 0.7)',
    'red-orange': '0 0 15px rgba(255, 69, 0, 0.7), 0 0 25px rgba(255, 99, 71, 0.7)',
    'retro-pink': '0 0 15px rgba(255, 105, 180, 0.7), 0 0 25px rgba(148, 0, 211, 0.7)',
    'retro-teal': '0 0 15px rgba(0, 128, 128, 0.7), 0 0 25px rgba(64, 224, 208, 0.7)',
    'brown-gold': '0 0 15px rgba(139, 69, 19, 0.7), 0 0 25px rgba(255, 215, 0, 0.7)',
    'white-grey': '0 0 15px rgba(245, 245, 220, 0.7), 0 0 25px rgba(128, 128, 128, 0.7)',
  };
  return (
    <div className="relative w-full">
      <textarea
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105",
          className
        )}
        style={{ boxShadow: gradientStyles[inputGradient] || gradientStyles['blue-purple'], resize: 'none' }}
        onMouseEnter={(e) => e.target.style.boxShadow = hoverGradientStyles[inputGradient] || hoverGradientStyles['blue-purple']}
        onMouseLeave={(e) => e.target.style.boxShadow = gradientStyles[inputGradient] || gradientStyles['blue-purple']}
        {...props}
      />
    </div>
  );
};

const Button = ({ className, variant = "default", buttonGradient, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    gradient: buttonGradient === "grey-yellow" ? "bg-gradient-to-r from-gray-500 to-yellow-600 text-black hover:from-gray-600 hover:to-yellow-700 focus:ring-yellow-500 transform hover:scale-105" :
      buttonGradient === "green-cyan" ? "bg-gradient-to-r from-green-500 to-cyan-600 text-white hover:from-green-600 hover:to-cyan-700 focus:ring-green-500 transform hover:scale-105" :
      buttonGradient === "dark-grey" ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 transform hover:scale-105" :
      buttonGradient === "red-orange" ? "bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 focus:ring-red-500 transform hover:scale-105" :
      buttonGradient === "retro-pink" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 transform hover:scale-105" :
      buttonGradient === "retro-teal" ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500 transform hover:scale-105" :
      buttonGradient === "brown-gold" ? "bg-gradient-to-r from-amber-900 to-yellow-600 text-white hover:from-amber-800 hover:to-yellow-700 focus:ring-amber-500 transform hover:scale-105" :
      buttonGradient === "white-grey" ? "bg-gradient-to-r from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600 focus:ring-gray-400 transform hover:scale-105" :
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
    gradientReverse: buttonGradient === "grey-yellow" ? "bg-gradient-to-l from-gray-500 to-yellow-600 text-black hover:from-gray-600 hover:to-yellow-700 focus:ring-yellow-500 transform hover:scale-105" :
      buttonGradient === "green-cyan" ? "bg-gradient-to-l from-green-500 to-cyan-600 text-white hover:from-green-600 hover:to-cyan-700 focus:ring-green-500 transform hover:scale-105" :
      buttonGradient === "dark-grey" ? "bg-gradient-to-l from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 transform hover:scale-105" :
      buttonGradient === "red-orange" ? "bg-gradient-to-l from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 focus:ring-red-500 transform hover:scale-105" :
      buttonGradient === "retro-pink" ? "bg-gradient-to-l from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 transform hover:scale-105" :
      buttonGradient === "retro-teal" ? "bg-gradient-to-l from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500 transform hover:scale-105" :
      buttonGradient === "brown-gold" ? "bg-gradient-to-l from-amber-900 to-yellow-600 text-white hover:from-amber-800 hover:to-yellow-700 focus:ring-amber-500 transform hover:scale-105" :
      buttonGradient === "white-grey" ? "bg-gradient-to-l from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600 focus:ring-gray-400 transform hover:scale-105" :
      "bg-gradient-to-l from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
    text: buttonGradient === "grey-yellow" ? "text-yellow-400 hover:text-yellow-300 focus:ring-yellow-500" :
      buttonGradient === "green-cyan" ? "text-green-400 hover:text-green-300 focus:ring-green-500" :
      buttonGradient === "dark-grey" ? "text-gray-400 hover:text-gray-300 focus:ring-gray-500" :
      buttonGradient === "red-orange" ? "text-red-400 hover:text-red-300 focus:ring-red-500" :
      buttonGradient === "retro-pink" ? "text-pink-400 hover:text-pink-300 focus:ring-pink-500" :
      buttonGradient === "retro-teal" ? "text-teal-400 hover:text-teal-300 focus:ring-teal-500" :
      buttonGradient === "brown-gold" ? "text-amber-400 hover:text-amber-300 focus:ring-amber-500" :
      buttonGradient === "white-grey" ? "text-gray-600 hover:text-gray-500 focus:ring-gray-400" :
      "text-blue-400 hover:text-blue-300 focus:ring-blue-500",
    share: buttonGradient === "grey-yellow" ? "bg-gradient-to-r from-gray-500 to-yellow-600 text-black hover:from-gray-600 hover:to-yellow-700 focus:ring-yellow-500 transform hover:scale-105" :
      buttonGradient === "green-cyan" ? "bg-gradient-to-r from-green-500 to-cyan-600 text-white hover:from-green-600 hover:to-cyan-700 focus:ring-green-500 transform hover:scale-105" :
      buttonGradient === "dark-grey" ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 transform hover:scale-105" :
      buttonGradient === "red-orange" ? "bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 focus:ring-red-500 transform hover:scale-105" :
      buttonGradient === "retro-pink" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 transform hover:scale-105" :
      buttonGradient === "retro-teal" ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500 transform hover:scale-105" :
      buttonGradient === "brown-gold" ? "bg-gradient-to-r from-amber-900 to-yellow-600 text-white hover:from-amber-800 hover:to-yellow-700 focus:ring-amber-500 transform hover:scale-105" :
      buttonGradient === "white-grey" ? "bg-gradient-to-r from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600 focus:ring-gray-400 transform hover:scale-105" :
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
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
  const gradientStyles = {
    'grey-yellow': 'bg-gradient-to-r from-gray-300 to-yellow-500 bg-clip-text text-transparent',
    'blue-purple': 'bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent',
    'green-cyan': 'bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent',
    'dark-grey': 'bg-gradient-to-r from-gray-500 to-gray-700 bg-clip-text text-transparent',
    'red-orange': 'bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent',
    'retro-pink': 'bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent',
    'retro-teal': 'bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent',
    'brown-gold': 'bg-gradient-to-r from-amber-900 to-yellow-500 bg-clip-text text-transparent',
    'white-grey': 'bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent',
  };
  return (
    <h3
      className={cn(
        "text-2xl font-semibold mb-1",
        gradientStyles[inputGradient] || gradientStyles['blue-purple'],
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
    success: "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent animate-bounce",
  };
  return (
    <div
      role="alert"
      className={cn(
        baseStyles,
        variant === "success" ? (inputGradient === "grey-yellow" ? "bg-gradient-to-r from-gray-500 to-yellow-600 text-black" :
                                 inputGradient === "green-cyan" ? "bg-gradient-to-r from-green-500 to-cyan-600 text-white" :
                                 inputGradient === "dark-grey" ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white" :
                                 inputGradient === "red-orange" ? "bg-gradient-to-r from-red-500 to-orange-600 text-white" :
                                 inputGradient === "retro-pink" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" :
                                 inputGradient === "retro-teal" ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white" :
                                 inputGradient === "brown-gold" ? "bg-gradient-to-r from-amber-900 to-yellow-600 text-white" :
                                 inputGradient === "white-grey" ? "bg-gradient-to-r from-gray-300 to-gray-500 text-black" :
                                 "bg-gradient-to-r from-blue-600 to-purple-600 text-white") : variants[variant],
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
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  );
};
const TabsList = ({ className, ...props }) => (
  <div
    className={cn(
      "flex bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 shadow-lg w-full max-w-[400px] mx-auto",
      className
    )}
    {...props}
  />
);

const TabsTrigger = ({ value, onValueChange, tabValue, className, variant = "gradient", buttonGradient, ...props }) => {
  const baseStyles = "flex-1 py-3 px-6 text-lg font-semibold flex items-center justify-center transition-all duration-300";
  const variants = {
    gradient: buttonGradient === "grey-yellow" ? "bg-gradient-to-r from-gray-500 to-yellow-600 text-black hover:from-gray-600 hover:to-yellow-700 focus:ring-yellow-500 transform hover:scale-105" :
      buttonGradient === "green-cyan" ? "bg-gradient-to-r from-green-500 to-cyan-600 text-white hover:from-green-600 hover:to-cyan-700 focus:ring-green-500 transform hover:scale-105" :
      buttonGradient === "dark-grey" ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 transform hover:scale-105" :
      buttonGradient === "red-orange" ? "bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 focus:ring-red-500 transform hover:scale-105" :
      buttonGradient === "retro-pink" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 transform hover:scale-105" :
      buttonGradient === "retro-teal" ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500 transform hover:scale-105" :
      buttonGradient === "brown-gold" ? "bg-gradient-to-r from-amber-900 to-yellow-600 text-white hover:from-amber-800 hover:to-yellow-700 focus:ring-amber-500 transform hover:scale-105" :
      buttonGradient === "white-grey" ? "bg-gradient-to-r from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600 focus:ring-gray-400 transform hover:scale-105" :
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
    gradientReverse: buttonGradient === "grey-yellow" ? "bg-gradient-to-l from-gray-500 to-yellow-600 text-black hover:from-gray-600 hover:to-yellow-700 focus:ring-yellow-500 transform hover:scale-105" :
      buttonGradient === "green-cyan" ? "bg-gradient-to-l from-green-500 to-cyan-600 text-white hover:from-green-600 hover:to-cyan-700 focus:ring-green-500 transform hover:scale-105" :
      buttonGradient === "dark-grey" ? "bg-gradient-to-l from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 transform hover:scale-105" :
      buttonGradient === "red-orange" ? "bg-gradient-to-l from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 focus:ring-red-500 transform hover:scale-105" :
      buttonGradient === "retro-pink" ? "bg-gradient-to-l from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 transform hover:scale-105" :
      buttonGradient === "retro-teal" ? "bg-gradient-to-l from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500 transform hover:scale-105" :
      buttonGradient === "brown-gold" ? "bg-gradient-to-l from-amber-900 to-yellow-600 text-white hover:from-amber-800 hover:to-yellow-700 focus:ring-amber-500 transform hover:scale-105" :
      buttonGradient === "white-grey" ? "bg-gradient-to-l from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600 focus:ring-gray-400 transform hover:scale-105" :
      "bg-gradient-to-l from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
  };
  const hoverStyles = {
    gradient: buttonGradient === "grey-yellow" ? "from-gray-600 to-yellow-700" :
      buttonGradient === "green-cyan" ? "from-green-600 to-cyan-700" :
      buttonGradient === "dark-grey" ? "from-gray-800 to-gray-900" :
      buttonGradient === "red-orange" ? "from-red-600 to-orange-700" :
      buttonGradient === "retro-pink" ? "from-pink-600 to-purple-700" :
      buttonGradient === "retro-teal" ? "from-teal-600 to-cyan-700" :
      buttonGradient === "brown-gold" ? "from-amber-800 to-yellow-700" :
      buttonGradient === "white-grey" ? "from-gray-400 to-gray-600" :
      "from-blue-700 to-purple-700",
    gradientReverse: buttonGradient === "grey-yellow" ? "from-gray-600 to-yellow-700" :
      buttonGradient === "green-cyan" ? "from-green-600 to-cyan-700" :
      buttonGradient === "dark-grey" ? "from-gray-800 to-gray-900" :
      buttonGradient === "red-orange" ? "from-red-600 to-orange-700" :
      buttonGradient === "retro-pink" ? "from-pink-600 to-purple-700" :
      buttonGradient === "retro-teal" ? "from-teal-600 to-cyan-700" :
      buttonGradient === "brown-gold" ? "from-amber-800 to-yellow-700" :
      buttonGradient === "white-grey" ? "from-gray-400 to-gray-600" :
      "from-blue-700 to-purple-700",
  };
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        value === tabValue ? cn(
          variant === "gradient" ? `bg-gradient-to-r ${hoverStyles.gradient}` :
          variant === "gradientReverse" ? `bg-gradient-to-l ${hoverStyles.gradientReverse}` : "",
          "text-cyan-300"
        ) : "",
        className
      )}
      onClick={() => onValueChange(tabValue)}
      {...props}
    />
  );
};


// const TabsTrigger = ({ value, onValueChange, tabValue, className, variant = "gradient", buttonGradient, ...props }) => {
//   const baseStyles = "flex-1 py-3 px-6 text-lg font-semibold flex items-center justify-center transition-all duration-300";
//   const variants = {
//     gradient: buttonGradient === "grey-yellow" ? "bg-gradient-to-r from-gray-500 to-yellow-600 text-black hover:from-gray-600 hover:to-yellow-700 focus:ring-yellow-500 transform hover:scale-105" :
//       buttonGradient === "green-cyan" ? "bg-gradient-to-r from-green-500 to-cyan-600 text-white hover:from-green-600 hover:to-cyan-700 focus:ring-green-500 transform hover:scale-105" :
//       buttonGradient === "dark-grey" ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 transform hover:scale-105" :
//       buttonGradient === "red-orange" ? "bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 focus:ring-red-500 transform hover:scale-105" :
//       buttonGradient === "retro-pink" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 transform hover:scale-105" :
//       buttonGradient === "retro-teal" ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500 transform hover:scale-105" :
//       buttonGradient === "brown-gold" ? "bg-gradient-to-r from-amber-900 to-yellow-600 text-white hover:from-amber-800 hover:to-yellow-700 focus:ring-amber-500 transform hover:scale-105" :
//       buttonGradient === "white-grey" ? "bg-gradient-to-r from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600 focus:ring-gray-400 transform hover:scale-105" :
//       "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
//     gradientReverse: buttonGradient === "grey-yellow" ? "bg-gradient-to-l from-gray-500 to-yellow-600 text-black hover:from-gray-600 hover:to-yellow-700 focus:ring-yellow-500 transform hover:scale-105" :
//       buttonGradient === "green-cyan" ? "bg-gradient-to-l from-green-500 to-cyan-600 text-white hover:from-green-600 hover:to-cyan-700 focus:ring-green-500 transform hover:scale-105" :
//       buttonGradient === "dark-grey" ? "bg-gradient-to-l from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 transform hover:scale-105" :
//       buttonGradient === "red-orange" ? "bg-gradient-to-l from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 focus:ring-red-500 transform hover:scale-105" :
//       buttonGradient === "retro-pink" ? "bg-gradient-to-l from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 focus:ring-pink-500 transform hover:scale-105" :
//       buttonGradient === "retro-teal" ? "bg-gradient-to-l from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 focus:ring-teal-500 transform hover:scale-105" :
//       buttonGradient === "brown-gold" ? "bg-gradient-to-l from-amber-900 to-yellow-600 text-white hover:from-amber-800 hover:to-yellow-700 focus:ring-amber-500 transform hover:scale-105" :
//       buttonGradient === "white-grey" ? "bg-gradient-to-l from-gray-300 to-gray-500 text-black hover:from-gray-400 hover:to-gray-600 focus:ring-gray-400 transform hover:scale-105" :
//       "bg-gradient-to-l from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 transform hover:scale-105",
//   };
//   return (
//     <button
//       className={cn(
//         baseStyles,
//         variants[variant],
//         value === tabValue ? "bg-indigo-800 text-cyan-300" : "",
//         className
//       )}
//       onClick={() => onValueChange(tabValue)}
//       {...props}
//     />
//   );
// };

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
  const [UserAppTitle, setUserAppTitle] = useState(() => {
    return localStorage.getItem('UserAppTitle') || 'A Grande Day Out';
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
  const [sharedUsers, setSharedUsers] = useState([]);
  const [shareEmail, setShareEmail] = useState('');
  const [inputGradient, setInputGradient] = useState(() => {
    return localStorage.getItem('inputGradient') || 'blue-purple';
  });
  const [buttonGradient, setButtonGradient] = useState(() => {
    return localStorage.getItem('buttonGradient') || 'dark-grey';
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
  const [showGuide, setShowGuide] = useState(false);

  // Persist state
  useEffect(() => {
    localStorage.setItem('isSignedIn', isSignedIn);
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userName', userName);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('hourlyRate', hourlyRate);
    localStorage.setItem('currency', currency);
    localStorage.setItem('UserAppTitle', UserAppTitle);
    localStorage.setItem('calendarId', calendarId);
    localStorage.setItem('calendarName', calendarName);
    localStorage.setItem('inputGradient', inputGradient);
    localStorage.setItem('buttonGradient', buttonGradient);
    localStorage.setItem('devMode', devMode);
  }, [isSignedIn, userEmail, userName, accessToken, hourlyRate, currency, UserAppTitle, calendarId, calendarName, inputGradient, buttonGradient, devMode]);

  // Fetch calendar list when signed in
  useEffect(() => {
    if (isSignedIn && accessToken) {
      fetchCalendarList(accessToken).then(calendars => {
        setCalendarList(calendars);
      });
    }
  }, [isSignedIn, accessToken]);

  // Fetch shared users when calendarId changes
  useEffect(() => {
    if (calendarId && accessToken) {
      fetchSharedUsers(calendarId, accessToken).then(users => {
        setSharedUsers(users);
      });
    } else {
      setSharedUsers([]);
    }
  }, [calendarId, accessToken]);

  // Rocket animation (looping until login, original code)
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
              initialVelocities: {
                x: 12,
                y: -10
              },
              rotation: 0,
              rotationDeceleration: 0
            },
            position: {
              x: 150,
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
              x: 150,
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
              x: 200,
              y: blastYPos - 60
            }
          });
        };
        rocket();
        clouds();
        setTimeout(sparkles, 400);
      };

      // Run animation immediately and then every 2 seconds
      animate();
      intervalId = setInterval(animate, 2000);
    }

    // Clean up interval when user logs in or component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }     
    };
  }, [isSignedIn, isAnimating]);

  // Handle Google sign-in with implicit flow (popup)
  const handleSignIn = () => {
    // Stop rocket animation
    setIsAnimating(false);

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setSubmissionError('Google Identity Services not loaded. Please check your network and try again.');
      console.error('Google Identity Services script not loaded.');
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      callback: (response) => {
        if (response.error) {
          setSubmissionError(`Google sign-in failed: ${response.error}`);
          console.error('Sign-in error:', response);
          return;
        }
        console.log('Access token received:', response.access_token);
        setAccessToken(response.access_token);
        setIsSignedIn(true);

        fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        })
          .then(res => {
            if (!res.ok) {
              throw new Error('Failed to fetch user info');
            }
            return res.json();
          })
          .then(data => {
            setUserEmail(data.email);
            setUserName(data.name || data.given_name || 'User');
            console.log('User signed in:', data.email, 'Name:', data.name);
          })
          .catch(err => {
            setSubmissionError(`Failed to fetch userorul info: ${err.message}`);
            console.error('User info error:', err);
          });
      },
    });

    tokenClient.requestAccessToken();
  };

  // Handle skip login
  const handleSkipLogin = () => {
    setIsSignedIn(true);
    setDevMode(true);
    setIsAnimating(false);
  };

  // Handle logout
  const handleLogout = () => {
    if (accessToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('Access token revoked');
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
    setIsAnimating(true); // Restart animation on logout
    setSharedUsers([]);
  };

  // Automatically find or create Schedularr calendar after sign-in
  useEffect(() => {
    if (isSignedIn && !calendarId && !devMode && accessToken) {
      createSchedularrCalendar(accessToken, calendarName)
        .then(newId => {
          setCalendarId(newId);
          localStorage.setItem('calendarId', newId);
          setSubmissionOutput(`${calendarName} calendar found or created successfully!`);
          console.log('Calendar ID set:', newId);
        })
        .catch(err => setSubmissionError(err.message));
    }
  }, [isSignedIn, calendarId, devMode, accessToken, calendarName]);
  
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

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  const handleUserAppTitleChange = (e) => {
    setUserAppTitle(e.target.value);
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

  const handleCustomCalendarNameChange = (e) => {
    setCustomCalendarName(e.target.value);
  };

  const handleCreateCustomCalendar = async () => {
    if (!customCalendarName) {
      setCalendarIdError('Please enter a custom calendar name.');
      return;
    }
    try {
      const newId = await createSchedularrCalendar(accessToken, customCalendarName);
      setCalendarId(newId);
      setCalendarName(customCalendarName);
      localStorage.setItem('calendarId', newId);
      localStorage.setItem('calendarName', customCalendarName);
      setSubmissionOutput(`${customCalendarName} calendar found or created successfully!`);
      setShowCustomCalendarInput(false);
      setCustomCalendarName('');
    } catch (err) {
      setSubmissionError(err.message);
    }
  };

  const handleCalendarSelect = (calendar) => {
    setCalendarId(calendar.id);
    setCalendarName(calendar.summary);
    localStorage.setItem('calendarId', calendar.id);
    localStorage.setItem('calendarName', calendar.summary);
    setShowCalendarList(false);
    setSubmissionOutput(`Selected calendar: ${calendar.summary}`);
  };

  const handleShareEmailChange = (e) => {
    setShareEmail(e.target.value);
    setShareError('');
    setShareSuccess('');
  };

  const handleInputGradientChange = (e) => {
    setInputGradient(e.target.value);
  };

  const handleButtonGradientChange = (e) => {
    setButtonGradient(e.target.value);
  };

  const handleDefaultColors = () => {
    setInputGradient('brown-gold');
    setButtonGradient('dark-grey');
  };

  const handleDevModeChange = (e) => {
    setDevMode(e.target.checked);
  };

  // Handle calendar sharing
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
      await shareSchedularrCalendar(calendarId, shareEmail, accessToken);
      setShareSuccess(`Calendar shared successfully with ${shareEmail}!`);
      setShareEmail('');
      // Update shared users
      const updatedUsers = await fetchSharedUsers(calendarId, accessToken);
      setSharedUsers(updatedUsers);
      // Set timeout to clear the success message after 10 seconds
      setTimeout(() => {
        setShareSuccess('');
      }, 10000);
    } catch (err) {
      setShareError(err.message);
      // Set timeout to clear the error message after 10 seconds
      setTimeout(() => {
        setShareError('');
      }, 10000);
    }
  };

  // Auto-calculate end time, end date, and fee
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
        console.error('Invalid date format:', `${isoDate}T${event.startTime}`);
        setTimeError('Invalid date or time format.');
        return;
      }

      const durationMs = parseFloat(event.duration) * 60 * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      const calculatedEndDate = end.toISOString().split('T')[0];
      const calculatedEndTime = end.toTimeString().slice(0, 5);

      setEndTime(calculatedEndTime);
      setEndDate(calculatedEndDate);

      // Calculate fee as an integer (no decimals)
      const calculatedFee = parseFloat(event.duration) * hourlyRate;
      setCost(Math.round(calculatedFee));
    } else {
      setEndTime('');
      setEndDate('');
      setCost(0);
      setTimeError('');
    }
  }, [event.startDate, event.startTime, event.duration, hourlyRate]);

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
        const eventData = {
          summary: event.name || 'Test Event',
          description: `Duration: ${event.duration} hours\nFee: ${currency}${cost}${event.note ? `\nNote: ${event.note}` : ''}`,
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
      setTimeout(() => {
        setSubmissionError('');
      }, 10000);
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
      setTimeout(() => {
        setShowConfetti(false);
      }, 10000);
    } else {
      console.warn('Confetti library not loaded; skipping animation.');
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
      console.log('Showing calendar with src:', `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=UTC`);
    }
  };

  const openCalendarLink = () => {
    if (calendarId) {
      window.open(`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=UTC`, '_blank');
    }
  };

  // Render
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
          
   {/* Replace the old static paragraph with the RandomEnding component */}
   
   <div className="relative left-1/2 transform -translate-x-1/2 w-full max-w-[300px] text-lg mb-8">
  <RandomEnding className="relative left-1/2 transform -translate-x-1/2 w-full max-w-[300px]" />
</div>
   
      {/* <s className="text-base text-red-400">&nbsp;cancel&nbsp;</s>
      <a className="text-base text-green-400">&nbsp;&nbsp;book&nbsp;&nbsp;</a>
      <br></br> */}
          {/* The following static text was removed and replaced by RandomEnding */}
          {/* <p className="text-lg text-gray-300 mb-8">
  <s className="text-red-300">Don’t</s> use Schedularr if you'd  rather be at the beach 🏝️
</p> */}
          {/* <p className="text-lg text-gray-300 mb-4">Helping You Book Life 🏝️</p> */}

{/* Replace Button with Google Sign-In Button */}
      {/* Replace Button with Google Sign-In Button */}
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

<br></br>
          {/* <Button
            onClick={handleSignIn}
            variant="gradient"
            className="py-3 px-6 text-lg font-semibold flex items-center justify-center mx-auto mb-2"
            buttonGradient={buttonGradient}
          >
            <span className="material-icons mr-2 transition-transform duration-300 hover:scale-125 p-1">login</span> Login with Google
          </Button> */}



          {/* <div className="text-center relative">
            <Button
              variant="share"
              className="py-2 px-4 text-lg font-semibold"
              onClick={() => setShowGuide(!showGuide)}
              buttonGradient="dark-grey"
            >
            Guide
            </Button>
            {showGuide && (
              <div className=" text-xs text-gray-300 bg-gray-700/50 p-4 rounded-lg mt-2 text-left transform transition-all duration-300 ease-in-out origin-top scale-y-0 opacity-0 data-[visible=true]:scale-y-100 data-[visible=true]:opacity-100" data-visible="true">
                <p className="mb-2 font-bold">
                Rule the Scheduling Galaxy 🌀
                </p>
                <p className="mb-2">
                    Schedularr spices up your google calendar with a declarative 'Schedularr' calendar, making it a blast to sort out childcare, care for the elderly, pet sitting, or swapping chores with mates. 
                    </p>
                <p className="mb-2">
                    - Set rates in £ or 🍺, go wild, and make calendars cool again! 🎉
                  </p>
                <p className="mb-2">
                  - Sign in with Google to get started.
                </p>
                <p className="mt-2">
                  - Visit the Admin tab after signing in for more detailed instructions.
                </p>
              </div>
            )}
          </div> */}

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
            <p className="text-lg text-gray-300 mb-2">Welcome, {userName}!</p>
            </Tooltip>
            <h1 className="text-4xl font-extrabold flex items-center">
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Schedularr</span>
              <span className="relative w-8 h-8 ml-2">
                <img src={logo} alt="Schedularr Logo" className="w-full h-full " style={{ filter: 'brightness(0) invert(1)' }} />
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
                  
                  <CardTitle inputGradient={inputGradient}>{UserAppTitle}</CardTitle>
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

                  {/* // Form for booking begins here */}

                  <div className="space-y-6">
                    
                  <div className="relative flex items-center">
                  <Tooltip message="Event 🚀" position="bottom">
                    <span className={cn(
                      "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                      inputGradient === "grey-yellow" ? "text-yellow-400" :
                      inputGradient === "blue-purple" ? "text-blue-400" :
                      inputGradient === "green-cyan" ? "text-green-400" :
                      inputGradient === "dark-grey" ? "text-gray-400" :
                      inputGradient === "red-orange" ? "text-red-400" :
                      inputGradient === "retro-pink" ? "text-pink-400" :
                      inputGradient === "retro-teal" ? "text-teal-400" :
                      inputGradient === "brown-gold" ? "text-amber-400" :
                      inputGradient === "white-grey" ? "text-gray-600" :
                      "text-blue-400"
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
                          inputGradient === "grey-yellow" ? "text-yellow-400" : 
                          inputGradient === "blue-purple" ? "text-blue-400" : 
                          inputGradient === "green-cyan" ? "text-green-400" : 
                          inputGradient === "dark-grey" ? "text-grey-400" : 
                          inputGradient === "red-orange" ? "text-red-400" : 
                          inputGradient === "retro-pink" ? "text-pink-400" : 
                          inputGradient === "retro-teal" ? "text-teal-400" : 
                          inputGradient === "brown-gold" ? "text-amber-400" : 
                          inputGradient === "white-grey" ? "text-gray-600" : 
                          "text-blue-400"
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
                          inputGradient === "grey-yellow" ? "text-yellow-400" : 
                          inputGradient === "blue-purple" ? "text-blue-400" : 
                          inputGradient === "green-cyan" ? "text-green-400" : 
                          inputGradient === "dark-grey" ? "text-grey-400" : 
                          inputGradient === "red-orange" ? "text-red-400" : 
                          inputGradient === "retro-pink" ? "text-pink-400" : 
                          inputGradient === "retro-teal" ? "text-teal-400" : 
                          inputGradient === "brown-gold" ? "text-amber-400" : 
                          inputGradient === "white-grey" ? "text-gray-600" : 
                          "text-blue-400"
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
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
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
                    
                      <Divider inputGradient={inputGradient} />

                    <div className="flex items-center">
                    <Tooltip message="[auto] End time ⏰" position="bottom">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
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
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
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
                        <Tooltip message="[auto] agreed trade 🤝" position="bottom">
                          <Input
                            type="text"
                            value={cost || ''}
                            readOnly
                            className={cn("pr-12 cursor-pointer", cost ? 'text-white' : 'text-gray-400')}
                            inputGradient={inputGradient}
                            onClick={() => setActiveTab('settings')}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">fee</span>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    <Divider inputGradient={inputGradient} />

                    <div className="flex items-center">
                    <Tooltip message="Notes 📝" position="bottom">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
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
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
                      )}>font_download</span>
                      <Input
                        value={UserAppTitle}
                        onChange={handleUserAppTitleChange}
                        placeholder="A Grande Day Out"
                        inputGradient={inputGradient}
                      />
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
                      )}>calendar_today</span>
                      {calendarId ? (
                        <div className="flex items-center">
                          <p className="text-white cursor-pointer hover:underline" onClick={openCalendarLink}>{calendarName}</p>
                          <Button
                          variant="text"
                            className={cn(
                              "ml-2",
                              inputGradient === "grey-yellow" ? "text-yellow-400 hover:text-yellow-300 focus:ring-yellow-500" :
                              inputGradient === "green-cyan" ? "text-green-400 hover:text-green-300 focus:ring-green-500" :
                              inputGradient === "dark-grey" ? "text-gray-400 hover:text-gray-300 focus:ring-gray-500" :
                              inputGradient === "red-orange" ? "text-red-400 hover:text-red-300 focus:ring-red-500" :
                              inputGradient === "retro-pink" ? "text-pink-400 hover:text-pink-300 focus:ring-pink-500" :
                              inputGradient === "retro-teal" ? "text-teal-400 hover:text-teal-300 focus:ring-teal-500" :
                              inputGradient === "brown-gold" ? "text-amber-400 hover:text-amber-300 focus:ring-amber-500" :
                              inputGradient === "white-grey" ? "text-gray-600 hover:text-gray-500 focus:ring-gray-400" :
                              "text-blue-400 hover:text-blue-300 focus:ring-blue-500"
                            )}
                            onClick={() => setShowCalendarList(true)}
                            buttonGradient={buttonGradient}
                          >
                            Select
                          </Button>
                          <Button
                            variant="text"
                            className={cn(
                              "ml-2",
                              inputGradient === "grey-yellow" ? "text-yellow-400 hover:text-yellow-300 focus:ring-yellow-500" :
                              inputGradient === "green-cyan" ? "text-green-400 hover:text-green-300 focus:ring-green-500" :
                              inputGradient === "dark-grey" ? "text-gray-400 hover:text-gray-300 focus:ring-gray-500" :
                              inputGradient === "red-orange" ? "text-red-400 hover:text-red-300 focus:ring-red-500" :
                              inputGradient === "retro-pink" ? "text-pink-400 hover:text-pink-300 focus:ring-pink-500" :
                              inputGradient === "retro-teal" ? "text-teal-400 hover:text-teal-300 focus:ring-teal-500" :
                              inputGradient === "brown-gold" ? "text-amber-400 hover:text-amber-300 focus:ring-amber-500" :
                              inputGradient === "white-grey" ? "text-gray-600 hover:text-gray-500 focus:ring-gray-400" :
                              "text-blue-400 hover:text-blue-300 focus:ring-blue-500"
                            )}
                            onClick={() => setShowCustomCalendarInput(true)}
                            buttonGradient={buttonGradient}
                          >
                            New Custom
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <Button
                            variant="gradient"
                            onClick={() => createSchedularrCalendar(accessToken, calendarName)
                              .then(id => {
                                setCalendarId(id);
                                localStorage.setItem('calendarId', id);
                                setSubmissionOutput(`${calendarName} calendar found or created successfully!`);
                              })
                              .catch(err => setSubmissionError(err.message))
                            }
                            className="mb-2 w-full"
                            buttonGradient={buttonGradient}
                          >
                            Create {calendarName} Calendar
                          </Button>
                          <p className="text-sm text-gray-400 mb-2">Or enter an existing Calendar ID:</p>
                          <Textarea
                            value={calendarId}
                            onChange={handleCalendarIdChange}
                            placeholder="e.g., abc123@group.calendar.google.com"
                            rows="2"
                            inputGradient={inputGradient}
                          />
                        </div>
                      )}
                    </div>
                    {showCustomCalendarInput && (
                      <div className="flex items-center">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === "grey-yellow" ? "text-yellow-400" : 
                          inputGradient === "blue-purple" ? "text-blue-400" : 
                          inputGradient === "green-cyan" ? "text-green-400" : 
                          inputGradient === "dark-grey" ? "text-grey-400" : 
                          inputGradient === "red-orange" ? "text-red-400" : 
                          inputGradient === "retro-pink" ? "text-pink-400" : 
                          inputGradient === "retro-teal" ? "text-teal-400" : 
                          inputGradient === "brown-gold" ? "text-amber-400" : 
                          inputGradient === "white-grey" ? "text-gray-600" : 
                          "text-blue-400"
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
                      <div className="flex items-center">
                        <span className={cn(
                          "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                          inputGradient === "grey-yellow" ? "text-yellow-400" : 
                          inputGradient === "blue-purple" ? "text-blue-400" : 
                          inputGradient === "green-cyan" ? "text-green-400" : 
                          inputGradient === "dark-grey" ? "text-grey-400" : 
                          inputGradient === "red-orange" ? "text-red-400" : 
                          inputGradient === "retro-pink" ? "text-pink-400" : 
                          inputGradient === "retro-teal" ? "text-teal-400" : 
                          inputGradient === "brown-gold" ? "text-amber-400" : 
                          inputGradient === "white-grey" ? "text-gray-600" : 
                          "text-blue-400"
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
                            <option key={calendar.id} value={calendar.id}>{calendar.summary}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
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
                          inputGradient === "grey-yellow" ? "text-yellow-400" : 
                          inputGradient === "blue-purple" ? "text-blue-400" : 
                          inputGradient === "green-cyan" ? "text-green-400" : 
                          inputGradient === "dark-grey" ? "text-grey-400" : 
                          inputGradient === "red-orange" ? "text-red-400" : 
                          inputGradient === "retro-pink" ? "text-pink-400" : 
                          inputGradient === "retro-teal" ? "text-teal-400" : 
                          inputGradient === "brown-gold" ? "text-amber-400" : 
                          inputGradient === "white-grey" ? "text-gray-600" : 
                          "text-blue-400"
                        )}>person</span>
                        <p className={cn(
                          "text-sm",
                          inputGradient === "grey-yellow" ? "text-yellow-400" :
                          inputGradient === "green-cyan" ? "text-green-400" :
                          inputGradient === "dark-grey" ? "text-gray-400" :
                          inputGradient === "red-orange" ? "text-red-400" :
                          inputGradient === "retro-pink" ? "text-pink-400" :
                          inputGradient === "retro-teal" ? "text-teal-400" :
                          inputGradient === "brown-gold" ? "text-amber-400" :
                          inputGradient === "white-grey" ? "text-gray-600" :
                          "text-blue-400"
                        )}>
                          <span className="font-bold">Shared with:</span> {sharedUsers.join(', ')}
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


                  <Divider inputGradient={inputGradient} />

                  <Divider inputGradient={inputGradient} label="App colour" />

                  <Divider inputGradient={inputGradient} icon="star" />


                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
                      )}>account_balance_wallet</span>
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">{currency}</span>
                        <Input
                          type="number"
                          value={hourlyRate}
                          onChange={handleHourlyRateChange}
                          placeholder="Fee per unit"
                          step="1"
                          min="0"
                          className="pl-10 pr-12"
                          inputGradient={inputGradient}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">/hr</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
                      )}>currency_exchange</span>
                      <div className="relative w-full">
                        <Input
                          value={currency}
                          onChange={handleCurrencyChange}
                          placeholder="Currency"
                          maxLength="3"
                          inputGradient={inputGradient}
                          className="pr-24"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">e.g., £, $, 🍺</span>
                      </div>
                    </div>


                  <Divider inputGradient={inputGradient} />

                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
                      )}>palette</span>
                      <select
                        value={inputGradient}
                        onChange={handleInputGradientChange}
                        className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105"
                      >
                        <option value="grey-yellow">Grey/Yellow Glow</option>
                        <option value="blue-purple">Blue/Purple Glow</option>
                        <option value="green-cyan">Green/Cyan Glow</option>
                        <option value="dark-grey">Dark Grey Glow</option>
                        <option value="red-orange">Red/Orange Glow</option>
                        <option value="retro-pink">Retro Pink Glow</option>
                        <option value="retro-teal">Retro Teal Glow</option>
                        <option value="brown-gold">Brown/Gold Glow</option>
                        <option value="white-grey">white/Grey Glow</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
                      )}>radio_button_checked</span>
                      <select
                        value={buttonGradient}
                        onChange={handleButtonGradientChange}
                        className="flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105"
                      >
                        <option value="grey-yellow">Grey/Yellow Glow</option>
                        <option value="blue-purple">Blue/Purple Glow</option>
                        <option value="green-cyan">Green/Cyan Glow</option>
                        <option value="dark-grey">Dark Grey Glow</option>
                        <option value="red-orange">Red/Orange Glow</option>
                        <option value="retro-pink">Retro Pink Glow</option>
                        <option value="retro-teal">Retro Teal Glow</option>
                        <option value="brown-gold">Brown/Gold Glow</option>
                        <option value="white-grey">white/Grey Glow</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
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

                  <Divider inputGradient={inputGradient} /> 

                    <div className="flex items-center">
                      <span className={cn(
                        "material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1",
                        inputGradient === "grey-yellow" ? "text-yellow-400" : 
                        inputGradient === "blue-purple" ? "text-blue-400" : 
                        inputGradient === "green-cyan" ? "text-green-400" : 
                        inputGradient === "dark-grey" ? "text-grey-400" : 
                        inputGradient === "red-orange" ? "text-red-400" : 
                        inputGradient === "retro-pink" ? "text-pink-400" : 
                        inputGradient === "retro-teal" ? "text-teal-400" : 
                        inputGradient === "brown-gold" ? "text-amber-400" : 
                        inputGradient === "white-grey" ? "text-gray-600" : 
                        "text-blue-400"
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
                  src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=UTC`}
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
