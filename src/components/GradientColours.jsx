import { cn } from '../utils/cn.jsx';

// Utility function to map simplified color names to Tailwind background gradient classes
export const getGradientClass = (color, direction = 'to-r') => {
  const gradientMap = {
    yellow: `bg-gradient-${direction} from-gray-500 to-yellow-600`,
    purple: `bg-gradient-${direction} from-blue-600 to-purple-600`,
    cyan: `bg-gradient-${direction} from-green-500 to-cyan-600`,
    grey: `bg-gradient-${direction} from-gray-700 to-gray-800`,
    orange: `bg-gradient-${direction} from-red-500 to-orange-600`,
    pink: `bg-gradient-${direction} from-pink-500 to-purple-600`,
    teal: `bg-gradient-${direction} from-teal-500 to-cyan-600`,
    gold: `bg-gradient-${direction} from-amber-900 to-yellow-600`,
    white: `bg-gradient-${direction} from-gray-300 to-gray-500`,
  };

  return cn(gradientMap[color] || `bg-gradient-${direction} from-amber-900 to-yellow-600`);
};

// Utility function to map simplified color names to Tailwind text gradient classes
export const getTextGradientClass = (color) => {
  const textGradientMap = {
    yellow: 'bg-gradient-to-r from-gray-300 to-yellow-500 bg-clip-text text-transparent',
    purple: 'bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent',
    cyan: 'bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent',
    grey: 'bg-gradient-to-r from-gray-500 to-gray-700 bg-clip-text text-transparent',
    orange: 'bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent',
    pink: 'bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent',
    teal: 'bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent',
    gold: 'bg-gradient-to-r from-amber-900 to-yellow-500 bg-clip-text text-transparent',
    white: 'bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent',
  };

  return cn(textGradientMap[color] || 'bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent');
};

// Utility function to map simplified color names to boxShadow styles
export const getShadowGradientStyle = (color, hover = false) => {
  const shadowMap = {
    yellow: hover
      ? '0 0 15px rgba(128, 128, 128, 0.7), 0 0 25px rgba(255, 215, 0, 0.7)'
      : '0 0 10px rgba(128, 128, 128, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
    purple: hover
      ? '0 0 15px rgba(59, 130, 246, 0.7), 0 0 25px rgba(139, 92, 246, 0.7)'
      : '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.5)',
    cyan: hover
      ? '0 0 15px rgba(34, 197, 94, 0.7), 0 0 25px rgba(6, 182, 212, 0.7)'
      : '0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(6, 182, 212, 0.5)',
    grey: hover
      ? '0 0 15px rgba(50, 50, 50, 0.7), 0 0 25px rgba(100, 100, 100, 0.7)'
      : '0 0 10px rgba(50, 50, 50, 0.5), 0 0 20px rgba(100, 100, 100, 0.5)',
    orange: hover
      ? '0 0 15px rgba(255, 69, 0, 0.7), 0 0 25px rgba(255, 99, 71, 0.7)'
      : '0 0 10px rgba(255, 69, 0, 0.5), 0 0 20px rgba(255, 99, 71, 0.5)',
    pink: hover
      ? '0 0 15px rgba(255, 105, 180, 0.7), 0 0 25px rgba(148, 0, 211, 0.7)'
      : '0 0 10px rgba(255, 105, 180, 0.5), 0 0 20px rgba(148, 0, 211, 0.5)',
    teal: hover
      ? '0 0 15px rgba(0, 128, 128, 0.7), 0 0 25px rgba(64, 224, 208, 0.7)'
      : '0 0 10px rgba(0, 128, 128, 0.5), 0 0 20px rgba(64, 224, 208, 0.5)',
    gold: hover
      ? '0 0 15px rgba(139, 69, 19, 0.7), 0 0 25px rgba(255, 215, 0, 0.7)'
      : '0 0 10px rgba(139, 69, 19, 0.5), 0 0 20px rgba(255, 215, 0, 0.5)',
    white: hover
      ? '0 0 15px rgba(245, 245, 220, 0.7), 0 0 25px rgba(128, 128, 128, 0.7)'
      : '0 0 10px rgba(245, 245, 220, 0.5), 0 0 20px rgba(128, 128, 128, 0.5)',
  };

  return shadowMap[color] || (hover
    ? '0 0 15px rgba(59, 130, 246, 0.7), 0 0 25px rgba(139, 92, 246, 0.7)'
    : '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.5)');
};