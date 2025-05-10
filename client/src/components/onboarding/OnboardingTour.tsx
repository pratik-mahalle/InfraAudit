import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, SkipForwardIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import CloudMascot from './CloudMascot';
import { useOnboarding } from './OnboardingContext';

export const OnboardingTour: React.FC = () => {
  const { 
    currentStep, 
    isOnboarding, 
    nextStep, 
    previousStep, 
    dismissOnboarding 
  } = useOnboarding();
  
  const [, navigate] = useLocation();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [elementObserver, setElementObserver] = useState<MutationObserver | null>(null);
  
  // Function to find and position tooltip relative to the target element
  const findAndPositionTooltip = () => {
    if (!currentStep || !isOnboarding) return;
    
    const content = OnboardingContent[currentStep];
    
    // If this step has a target element, find it and position the tooltip
    if (content.targetElementId) {
      const element = document.getElementById(content.targetElementId);
      if (element) {
        setTargetElement(element);
        
        const rect = element.getBoundingClientRect();
        const position = calculatePosition(rect, content.position);
        setTooltipPosition(position);
        
        // Highlight the element
        element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-70', 'ring-offset-2', 'transition-all', 'duration-300');
        
        // Scroll element into view if needed
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // If element not found, position in center
        setTargetElement(null);
        setTooltipPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 150,
        });
      }
    } else {
      // Center in viewport for steps without a target
      setTargetElement(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 150,
      });
    }
  };
  
  // Effect to find and position the tooltip whenever the step changes
  useEffect(() => {
    // Clean up previous observer
    if (elementObserver) {
      elementObserver.disconnect();
    }
    
    if (!currentStep || !isOnboarding) return;
    
    const content = OnboardingContent[currentStep];
    
    // If this step needs to navigate to a different route
    if (content.routePath) {
      // Create a small delay to allow for route change
      const timer = setTimeout(() => {
        findAndPositionTooltip();
        
        // Set up an observer to watch for DOM changes
        const observer = new MutationObserver(() => {
          findAndPositionTooltip();
        });
        
        observer.observe(document.body, { 
          childList: true, 
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style']
        });
        
        setElementObserver(observer);
      }, 500);
      
      return () => {
        clearTimeout(timer);
        if (elementObserver) {
          elementObserver.disconnect();
        }
      };
    } else {
      findAndPositionTooltip();
    }
    
    // Handle window resize
    const handleResize = () => {
      findAndPositionTooltip();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Remove highlight from target element
      if (content.targetElementId) {
        const element = document.getElementById(content.targetElementId);
        if (element) {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-70', 'ring-offset-2');
        }
      }
      
      if (elementObserver) {
        elementObserver.disconnect();
      }
    };
  }, [currentStep, isOnboarding]);
  
  // Calculate position based on target element
  const calculatePosition = (rect: DOMRect, position?: string) => {
    const offset = 20; // Distance from target element
    const tooltipWidth = 320;
    const tooltipHeight = 220;
    
    // Ensure the tooltip stays in the viewport
    const constrainToViewport = (pos: {top: number, left: number}) => {
      const padding = 20;
      
      return {
        top: Math.max(padding, Math.min(pos.top, window.innerHeight - tooltipHeight - padding)),
        left: Math.max(padding, Math.min(pos.left, window.innerWidth - tooltipWidth - padding))
      };
    };
    
    let calculatedPosition;
    
    switch (position) {
      case 'top':
        calculatedPosition = {
          top: rect.top - offset - tooltipHeight,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
        break;
      case 'bottom':
        calculatedPosition = {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
        break;
      case 'left':
        calculatedPosition = {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - offset - tooltipWidth,
        };
        break;
      case 'right':
        calculatedPosition = {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + offset,
        };
        break;
      case 'center':
        calculatedPosition = {
          top: window.innerHeight / 2 - tooltipHeight / 2,
          left: window.innerWidth / 2 - tooltipWidth / 2,
        };
        break;
      default:
        // Default to bottom
        calculatedPosition = {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
    }
    
    return constrainToViewport(calculatedPosition);
  };
  
  if (!currentStep || !isOnboarding) return null;
  
  const content = OnboardingContent[currentStep];
  const isFirstStep = currentStep === 'welcome';
  const isLastStep = currentStep === 'completed';
  
  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] pointer-events-auto" />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.3, type: 'spring', damping: 20 }}
          style={{
            position: 'absolute',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            zIndex: 9999,
          }}
          className="pointer-events-auto"
        >
          <div className="bg-white rounded-lg shadow-xl border border-blue-100 p-5 w-[320px] dark:bg-slate-900 dark:border-blue-900/40">
            <div className="flex justify-between items-start">
              <CloudMascot 
                expression={content.mascotExpression} 
                size="md" 
              />
              
              <div className="flex space-x-2">
                <button 
                  onClick={dismissOnboarding}
                  title="Skip tour"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center"
                >
                  <SkipForwardIcon size={16} className="mr-1" />
                  <span className="text-xs">Skip</span>
                </button>
                <button 
                  onClick={dismissOnboarding}
                  title="Close tour"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XCircleIcon size={20} />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400">{content.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">{content.message}</p>
            </div>
            
            <div className="flex justify-between mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={isFirstStep}
                className={isFirstStep ? 'opacity-0 cursor-default' : ''}
              >
                <ChevronLeftIcon size={16} className="mr-1" /> Back
              </Button>
              
              <Button 
                size="sm"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLastStep ? 'Finish' : 'Next'} <ChevronRightIcon size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default OnboardingTour;