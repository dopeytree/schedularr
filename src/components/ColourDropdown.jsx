// components/ColourDropdown.jsx
import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { cn } from '../utils/cn.jsx'; // Adjust the path based on your folder structure


const ColourDropdown = ({ value, onChange, icon, inputGradient }) => {
  // Define color options (simplified to single colors for now, can be extended to gradients)
  const colorOptions = [
    { value: 'yellow', label: 'Yellow' },
    { value: 'purple', label: 'Purple' },
    { value: 'cyan', label: 'Cyan' },
    { value: 'grey', label: 'Grey' },
    { value: 'orange', label: 'Orange' },
    { value: 'pink', label: 'Pink' },
    { value: 'teal', label: 'Teal' },
    { value: 'gold', label: 'Gold' },
    { value: 'white', label: 'White' },
  ];

  // Map inputGradient to icon colors (consistent with App.jsx)
  const iconColorClass = cn(
    'material-icons mr-3 transition-transform duration-300 hover:scale-125 p-1',
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
  );

  return (
    <div className="flex items-center">
      <span className={iconColorClass}>{icon}</span>
      <select
        value={value}
        onChange={onChange}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900',
          'transition-all duration-300 transform hover:scale-105'
        )}
      >
        {colorOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

ColourDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  inputGradient: PropTypes.string.isRequired,
};

export default ColourDropdown;