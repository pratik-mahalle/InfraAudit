import React from 'react';
import { CloudIcon, ShieldCheckIcon, AlertCircleIcon, ArrowRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CloudMascotProps {
  expression?: 'happy' | 'thinking' | 'alert';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  speaking?: boolean;
  message?: string;
  onDismiss?: () => void;
}

export const CloudMascot: React.FC<CloudMascotProps> = ({
  expression = 'happy',
  className,
  size = 'md',
  speaking = false,
  message,
  onDismiss,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const expressionColors = {
    happy: 'text-blue-500',
    thinking: 'text-indigo-500',
    alert: 'text-amber-500',
  };

  const expressionIcons = {
    happy: <CloudIcon className="absolute" />,
    thinking: <CloudIcon className="absolute" />,
    alert: <CloudIcon className="absolute" />,
  };

  // Face expressions for the mascot
  const renderFace = () => {
    switch (expression) {
      case 'happy':
        return (
          <g className="cloud-face">
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            <circle cx="13" cy="7" r="1.5" fill="currentColor" />
            <path
              d="M6 11c2 1.5 6 1.5 8 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        );
      case 'thinking':
        return (
          <g className="cloud-face">
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            <circle cx="13" cy="7" r="1.5" fill="currentColor" />
            <path
              d="M7 12h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        );
      case 'alert':
        return (
          <g className="cloud-face">
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            <circle cx="13" cy="7" r="1.5" fill="currentColor" />
            <path
              d="M7 12L13 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("relative flex items-start", className)}>
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className={cn(
            "rounded-full bg-white border-2 border-blue-200 relative flex items-center justify-center shadow-lg",
            sizeClasses[size],
            expressionColors[expression]
          )}
        >
          <svg viewBox="0 0 20 20" className="w-full h-full">
            {renderFace()}
          </svg>
          
          {expression === 'happy' && (
            <ShieldCheckIcon className="absolute -bottom-1 -right-1 h-1/3 w-1/3 text-green-500 bg-white rounded-full" />
          )}
          
          {expression === 'alert' && (
            <AlertCircleIcon className="absolute -bottom-1 -right-1 h-1/3 w-1/3 text-amber-500 bg-white rounded-full" />
          )}
        </motion.div>
      </div>
      
      {speaking && message && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="ml-3 bg-white rounded-lg p-3 shadow-lg border border-gray-200 max-w-xs relative"
          >
            <div className="absolute left-0 top-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform -translate-x-1 rotate-45" />
            <p className="text-sm text-gray-800">{message}</p>
            
            {onDismiss && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className="mt-2 flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Continue <ArrowRightIcon className="ml-1 h-3 w-3" />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default CloudMascot;