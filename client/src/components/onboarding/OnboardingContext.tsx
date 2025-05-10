import React, { createContext, useContext, useState, useEffect } from 'react';

// Onboarding steps
export type OnboardingStep = 
  | 'welcome'
  | 'dashboard-overview'
  | 'connect-aws'
  | 'security-monitoring'
  | 'cost-optimization'
  | 'alerts-setup'
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
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Order of steps in the onboarding flow
const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'dashboard-overview',
  'connect-aws',
  'security-monitoring',
  'cost-optimization',
  'alerts-setup',
  'completed'
];

export const OnboardingProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);

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