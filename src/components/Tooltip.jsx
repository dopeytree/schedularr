import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { cn } from '../utils/cn.jsx';

export default function Tooltip({ message, children, position = 'top', autoFadeDuration = 3000 }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full mb-3',
    bottom: 'top-full mt-3',
    left: 'right-full mr-3',
    right: 'left-full ml-3',
  };

  const arrowStyles = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 rotate-45',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 rotate-45',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 rotate-45',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 rotate-45',
  };

  // Debug hover and auto-fade
  useEffect(() => {
    console.log('Tooltip isVisible:', isVisible);
    let timer;
    if (isVisible) {
      console.log('Starting tooltip timer for', autoFadeDuration, 'ms');
      timer = setTimeout(() => {
        console.log('Hiding tooltip');
        setIsVisible(false);
      }, autoFadeDuration);
    }
    return () => {
      console.log('Clearing tooltip timer');
      clearTimeout(timer);
    };
  }, [isVisible, autoFadeDuration]);

  return (
    <div
      className="relative inline-flex group"
      onMouseEnter={() => {
        console.log('Mouse entered, showing tooltip');
        setIsVisible(true);
      }}
      onMouseLeave={() => {
        console.log('Mouse left, hiding tooltip');
        setIsVisible(false);
      }}
    >
      {children}
      <div
        className={cn(
          'react-tooltip absolute z-20 min-w-max px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg border border-gray-700',
          'transition-opacity duration-300 ease-in-out',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
          positionStyles[position],
          position === 'top' || position === 'bottom' ? 'left-1/2 -translate-x-1/2' : '',
          position === 'left' || position === 'right' ? 'top-1/2 -translate-y-1/2' : ''
        )}
      >
        <span className="relative z-10">{message}</span>
        <div
          className={cn(
            'absolute w-3 h-3 bg-gray-800 border-gray-700',
            position === 'top' ? 'border-b border-r' : '',
            position === 'bottom' ? 'border-t border-l' : '',
            position === 'left' ? 'border-t border-r' : '',
            position === 'right' ? 'border-b border-l' : '',
            arrowStyles[position]
          )}
        />
      </div>
    </div>
  );
}
