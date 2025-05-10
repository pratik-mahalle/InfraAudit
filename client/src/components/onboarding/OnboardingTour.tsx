import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CloudMascot from './CloudMascot';
import { useOnboarding } from './OnboardingContext';
import { OnboardingContent } from './OnboardingTourContent';

export const OnboardingTour: React.FC = () => {
  const { 
    currentStep, 
    isOnboarding, 
    nextStep, 
    previousStep, 
    dismissOnboarding 
  } = useOnboarding();
  
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
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
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'transition-all', 'duration-300');
      } else {
        setTargetElement(null);
      }
    } else {
      // Center in viewport for steps without a target
      setTargetElement(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
      });
    }
    
    // Cleanup
    return () => {
      if (content.targetElementId) {
        const element = document.getElementById(content.targetElementId);
        if (element) {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }
      }
    };
  }, [currentStep, isOnboarding]);
  
  // Calculate position based on target element
  const calculatePosition = (rect: DOMRect, position?: string) => {
    const offset = 20; // Distance from target element
    
    switch (position) {
      case 'top':
        return {
          top: rect.top - offset - 150,
          left: rect.left + rect.width / 2 - 150,
        };
      case 'bottom':
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - 150,
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2 - 75,
          left: rect.left - offset - 300,
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2 - 75,
          left: rect.right + offset,
        };
      default:
        // Default to bottom
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - 150,
        };
    }
  };
  
  if (!currentStep || !isOnboarding) return null;
  
  const content = OnboardingContent[currentStep];
  const isFirstStep = currentStep === 'welcome';
  const isLastStep = currentStep === 'completed';
  
  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Optional overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-auto" />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            zIndex: 9999,
          }}
          className="pointer-events-auto"
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[300px]">
            <div className="flex justify-between items-start">
              <CloudMascot 
                expression={content.mascotExpression} 
                size="md" 
              />
              
              <button 
                onClick={dismissOnboarding}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon size={20} />
              </button>
            </div>
            
            <div className="mt-3">
              <h3 className="font-bold text-lg">{content.title}</h3>
              <p className="text-gray-600 mt-1">{content.message}</p>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={isFirstStep}
                className={isFirstStep ? 'opacity-0' : ''}
              >
                <ChevronLeftIcon size={16} className="mr-1" /> Back
              </Button>
              
              <Button 
                size="sm"
                onClick={nextStep}
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