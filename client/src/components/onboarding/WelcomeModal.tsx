import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, LightbulbIcon, ShieldCheckIcon, BarChart3Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CloudMascot from './CloudMascot';
import { useOnboarding } from './OnboardingContext';

export const WelcomeModal: React.FC = () => {
  const { startOnboarding, dismissOnboarding } = useOnboarding();
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    // Show welcome modal after a short delay on first visit
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleStartTour = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setOpen(false);
    startOnboarding();
  };
  
  const handleSkip = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setOpen(false);
    dismissOnboarding();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <CloudMascot 
              expression="happy" 
              size="lg" 
              className="bg-white/20 p-2 rounded-full" 
            />
            <div>
              <DialogTitle className="text-2xl">Welcome to CloudGuard!</DialogTitle>
              <DialogDescription className="text-blue-100 mt-1">
                Your intelligent cloud infrastructure monitoring platform
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Let me help you get started!</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Security Monitoring</h4>
                <p className="text-gray-600 text-sm">Detect configuration drifts and compliance issues in real-time</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                <BarChart3Icon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Cost Optimization</h4>
                <p className="text-gray-600 text-sm">AI-powered analysis to reduce cloud spending</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <LightbulbIcon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Intelligent Insights</h4>
                <p className="text-gray-600 text-sm">Smart recommendations based on your infrastructure</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-gray-50 p-4">
          <Button variant="outline" onClick={handleSkip}>
            Skip Tour
          </Button>
          <Button onClick={handleStartTour}>
            Start Guided Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;