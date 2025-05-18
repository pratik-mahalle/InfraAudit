import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircleIcon, 
  InfoIcon, 
  PlayIcon, 
  BookOpenIcon, 
  LifeBuoyIcon, 
  RefreshCw 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import CloudMascot from './CloudMascot';
import { useOnboarding } from './OnboardingContext';

export const HelpButton: React.FC = () => {
  const { startOnboarding, restartTour, isOnboarding } = useOnboarding();
  const [showHint, setShowHint] = useState(false);
  
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative">
        <AnimatePresence>
          {showHint && !isOnboarding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full right-0 mb-3 bg-white rounded-lg p-3 shadow-lg border border-gray-200 w-60"
            >
              <div className="flex items-start gap-3">
                <CloudMascot expression="happy" size="sm" />
                <div>
                  <p className="text-sm text-gray-800">Need help? I'm Cirrus, your cloud assistant!</p>
                </div>
              </div>
              <div className="absolute bottom-0 right-6 w-2 h-2 bg-white border-r border-b border-gray-200 transform translate-y-1 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border-2 border-blue-300/30"
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
            >
              <CloudMascot expression="happy" size="md" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>InfraAudit Assistant</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={startOnboarding} className="cursor-pointer">
                <PlayIcon className="mr-2 h-4 w-4" />
                <span>Start Guided Tour</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={restartTour} className="cursor-pointer">
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Restart Full Tour</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.location.href = "/documentation"}
              >
                <BookOpenIcon className="mr-2 h-4 w-4" />
                <span>Documentation</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.open('https://replit.com', '_blank')}
              >
                <LifeBuoyIcon className="mr-2 h-4 w-4" />
                <span>Get Support</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => alert('CloudGuard v1.0 - Your intelligent cloud infrastructure monitoring platform')}
              >
                <InfoIcon className="mr-2 h-4 w-4" />
                <span>About CloudGuard</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default HelpButton;