import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircleIcon, InfoIcon, PlayIcon, BookOpenIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import CloudMascot from './CloudMascot';
import { useOnboarding } from './OnboardingContext';

export const HelpButton: React.FC = () => {
  const { startOnboarding } = useOnboarding();
  const [showHint, setShowHint] = useState(false);
  
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative">
        {showHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full right-0 mb-3 bg-white rounded-lg p-3 shadow-lg border border-gray-200 w-60"
          >
            <div className="flex items-start gap-3">
              <CloudMascot expression="happy" size="sm" />
              <div>
                <p className="text-sm text-gray-800">Need help? I'm here to assist you!</p>
              </div>
            </div>
            <div className="absolute bottom-0 right-6 w-2 h-2 bg-white border-r border-b border-gray-200 transform translate-y-1 rotate-45" />
          </motion.div>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700"
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
            >
              <CloudMascot expression="happy" size="md" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={startOnboarding} className="cursor-pointer">
              <PlayIcon className="mr-2 h-4 w-4" />
              <span>Start Guided Tour</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <BookOpenIcon className="mr-2 h-4 w-4" />
              <span>Documentation</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <InfoIcon className="mr-2 h-4 w-4" />
              <span>About CloudGuard</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default HelpButton;