import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XIcon, 
  LightbulbIcon, 
  ShieldCheckIcon, 
  BarChart3Icon, 
  CloudIcon, 
  BellIcon, 
  SlackIcon, 
  RocketIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
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
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium">I'm Cirrus, your cloud assistant!</h3>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">New</Badge>
          </div>
          
          <p className="text-gray-600 mb-6">
            CloudGuard helps you monitor, secure, and optimize your cloud infrastructure across AWS, Azure, and Google Cloud.
            Let me show you what we can do together!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Security Monitoring</h4>
                <p className="text-gray-600 text-sm">Detect configuration drifts and compliance issues in real-time</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                <BarChart3Icon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Cost Optimization</h4>
                <p className="text-gray-600 text-sm">AI-powered analysis to reduce cloud spending</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-green-50 rounded-lg p-3">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <LightbulbIcon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Intelligent Insights</h4>
                <p className="text-gray-600 text-sm">Smart recommendations based on your usage patterns</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-purple-50 rounded-lg p-3">
              <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                <CloudIcon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Multi-Cloud Support</h4>
                <p className="text-gray-600 text-sm">Monitor AWS, Azure, and Google Cloud from one dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-red-50 rounded-lg p-3">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <BellIcon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Intelligent Alerts</h4>
                <p className="text-gray-600 text-sm">Get notified about critical issues before they impact your business</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-indigo-50 rounded-lg p-3">
              <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                <SlackIcon size={20} />
              </div>
              <div>
                <h4 className="font-medium">Slack Integration</h4>
                <p className="text-gray-600 text-sm">Get alerts and reports directly in your Slack channels</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-blue-600">
              <RocketIcon size={16} />
              <p className="text-sm font-medium">
                Take the guided tour to learn how to get the most out of CloudGuard!
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-gray-50 p-4 gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip Tour
          </Button>
          <Button onClick={handleStartTour} className="bg-blue-600 hover:bg-blue-700">
            Start Guided Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;