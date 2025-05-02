import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { cn } from '../utils/cn.jsx';
import PropTypes from 'prop-types';

const Divider = ({ inputGradient, label, icon }) => {
  const hrClass = cn(
    "h-px my-2 border-0",
    inputGradient === "grey-yellow" ? "bg-gradient-to-r from-gray-500 to-yellow-600 opacity-30":
    inputGradient === "blue-purple" ? "bg-gradient-to-r from-blue-600 to-purple-600 opacity-30" :
    inputGradient === "green-cyan" ? "bg-gradient-to-r from-green-500 to-cyan-600 opacity-30" :
    inputGradient === "dark-grey" ? "bg-gradient-to-r from-gray-700 to-gray-800 opacity-30" :
    inputGradient === "red-orange" ? "bg-gradient-to-r from-red-500 to-orange-600 opacity-30" :
    inputGradient === "retro-pink" ? "bg-gradient-to-r from-pink-500 to-purple-600 opacity-30" :
    inputGradient === "retro-teal" ? "bg-gradient-to-r from-teal-500 to-cyan-600 opacity-30" :
    inputGradient === "brown-gold" ? "bg-gradient-to-r from-amber-900 to-yellow-600 opacity-30" :
    inputGradient === "beige-grey" ? "bg-gradient-to-r from-gray-300 to-gray-500 opacity-30" :
    "bg-gradient-to-r from-blue-600 to-purple-600 opacity-30" // Default gradient
  );
  const hrStyle = { boxShadow: inputGradient === "dark-grey" ? "0 0 10px rgba(100, 100, 100, 0.5)" : "0 0 10px rgba(139, 92, 246, 0.5)" };
  return label || icon ? (
    <div className="flex items-center justify-center w-full gap-3">
      <hr className={cn(hrClass, "flex-1")} style={hrStyle} />
      {label && <span className="text-xs text-gray-900 dark:text-gray-400">{label}</span>}
      {icon && <span className="material-icons text-sm text-gray-900 dark:text-gray-400">{icon}</span>}
      <hr className={cn(hrClass, "flex-1")} style={hrStyle} />
    </div>
  ) : (
    <hr className={cn(hrClass, "w-full")} style={hrStyle} />
  );
};


export default Divider;