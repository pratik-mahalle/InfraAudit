import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// Onboarding steps
export type OnboardingStep = 
  | 'welcome'
  | 'dashboard-overview'
  | 'connect-aws'
  | 'aws-credentials'
  | 'security-monitoring'
  | 'security-drifts'
  | 'cost-optimization'
  | 'cost-prediction'
  | 'resource-utilization'
  | 'alerts-setup'
  | 'slack-integration'
  | 'settings-customization'
  | 'ai-insights'
  | 'completed';

interface OnboardingContextType {
  currentStep: OnboardingStep | null;
  isOnboarding: boolean;
  startOnboarding: () => void;
  dismissOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  completedSteps: Set<OnboardingStep>;
  markStepCompleted: (step: OnboardingStep) => void;
  restartTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Order of steps in the onboarding flow
const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'dashboard-overview',
  'connect-aws',
  'aws-credentials',
  'security-monitoring',
  'security-drifts',
  'cost-optimization',
  'cost-prediction',
  'resource-utilization',
  'alerts-setup',
  'slack-integration',
  'settings-customization',
  'ai-insights',
  'completed'
];

export const OnboardingProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check if user has completed onboarding before
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (onboardingCompleted === 'true') {
      setHasSeenOnboarding(true);
    }
  }, []);

  const startOnboarding = () => {
    setCurrentStep('welcome');
  };

  const dismissOnboarding = () => {
    setCurrentStep(null);
    localStorage.setItem('onboardingCompleted', 'true');
    setHasSeenOnboarding(true);
  };

  const restartTour = () => {
    localStorage.removeItem('onboardingCompleted');
    setHasSeenOnboarding(false);
    setCompletedSteps(new Set());
    setCurrentStep('welcome');
  };

  // Function to navigate to the appropriate page for the current step
  useEffect(() => {
    if (!currentStep) return;
    
    // Import here to avoid circular dependency
    const { OnboardingContent } = require('./OnboardingTourContent');
    
    // Get the route path for the current step
    const routePath = OnboardingContent[currentStep]?.routePath;
    
    // If the step has a route path, navigate to it
    if (routePath) {
      navigate(routePath);
    }
  }, [currentStep, navigate]);

  const nextStep = () => {
    if (!currentStep) return;
    
    // Mark current step as completed
    markStepCompleted(currentStep);
    
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    } else {
      // End of onboarding
      dismissOnboarding();
    }
  };

  const previousStep = () => {
    if (!currentStep) return;
    
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
  };

  const markStepCompleted = (step: OnboardingStep) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.add(step);
      return newSet;
    });
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        isOnboarding: currentStep !== null,
        startOnboarding,
        dismissOnboarding,
        nextStep,
        previousStep,
        goToStep,
        completedSteps,
        markStepCompleted,
        restartTour,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};