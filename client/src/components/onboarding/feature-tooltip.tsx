import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/lib/onboarding';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FeatureTooltipProps {
  section: 'dashboard' | 'quotes' | 'training' | 'users' | 'settings' | 'admin';
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export function FeatureTooltip({
  section,
  title,
  description,
  position = 'bottom',
  children
}: FeatureTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { 
    tutorialCompleted,
    dashboardSeen,
    quotesSeen,
    trainingSeen,
    usersSeen,
    settingsSeen,
    adminSeen,
    markSectionSeen
  } = useOnboardingStore();

  // Create a map to check if the section has been seen
  const sectionSeenMap = {
    dashboard: dashboardSeen,
    quotes: quotesSeen,
    training: trainingSeen,
    users: usersSeen,
    settings: settingsSeen,
    admin: adminSeen
  };

  useEffect(() => {
    // Only show tooltip if tutorial is completed and section hasn't been seen
    if (tutorialCompleted && !sectionSeenMap[section]) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 1000); // Delay to ensure page is loaded

      return () => clearTimeout(timer);
    }
  }, [tutorialCompleted, section, sectionSeenMap]);

  const handleDismiss = () => {
    setShowTooltip(false);
    markSectionSeen(section);
  };

  // Position classes based on the position prop
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className="relative inline-block">
      {children}
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${positionClasses[position]} bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-64 border border-gray-200 dark:border-gray-700`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
            
            <h4 className="font-semibold text-lg mb-2">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
            
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={handleDismiss}
            >
              Got it
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}