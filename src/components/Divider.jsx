import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../utils/cn.jsx';
import { getGradientClass, getShadowGradientStyle } from './GradientColours.jsx';

const Divider = ({ inputGradient, label, icon }) => {
  const hrClass = cn(
    "h-px my-2 border-0 opacity-30",
    getGradientClass(inputGradient)
  );
  const hrStyle = { boxShadow: getShadowGradientStyle(inputGradient) };

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

Divider.propTypes = {
  inputGradient: PropTypes.string,
  label: PropTypes.string,
  icon: PropTypes.string,
};

export default Divider;