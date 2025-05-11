import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOnboardingStore } from '@/lib/onboarding';
import { X } from 'lucide-react';

const steps = [
  {
    title: 'Welcome to Pricewith.AI!',
    content: "Get started with our AI-powered quoting system. We'll guide you through the main features to help you get up and running quickly.",
    image: '🚀'
  },
  {
    title: 'Manage Your Quotes',
    content: 'Create, edit, and track all your quotes in one place. Use AI to help generate accurate pricing for your services.',
    image: '📝'
  },
  {
    title: 'Train Your AI',
    content: 'Teach the AI about your business by providing examples and feedback to create more accurate quotes over time.',
    image: '🧠'
  },
  {
    title: 'Manage Users',
    content: 'Invite your team members and set their access levels to collaborate on quotes efficiently.',
    image: '👥'
  },
  {
    title: 'Customize Settings',
    content: 'Configure your account settings and connect to external services like Xero to streamline your workflow.',
    image: '⚙️'
  },
  {
    title: "You're All Set!",
    content: "You've completed the introductory tour. Feel free to explore the platform and start creating AI-powered quotes right away!",
    image: '🎉'
  }
];

export function OnboardingTutorial() {
  const { 
    tutorialCompleted, 
    currentStep, 
    markTutorialCompleted, 
    setCurrentStep, 
    fetchOnboardingState 
  } = useOnboardingStore();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      await fetchOnboardingState();
      if (!tutorialCompleted) {
        setOpen(true);
      }
    };
    
    checkOnboarding();
  }, [fetchOnboardingState, tutorialCompleted]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    markTutorialCompleted();
    setOpen(false);
  };

  const handleSkip = () => {
    markTutorialCompleted();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {steps[currentStep - 1]?.title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="text-6xl mb-2">
                {steps[currentStep - 1]?.image}
              </div>
              <p className="text-center text-gray-700 dark:text-gray-300">
                {steps[currentStep - 1]?.content}
              </p>
            </motion.div>
          </AnimatePresence>
          
          <div className="flex justify-center mt-6">
            {Array.from({ length: steps.length }).map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 mx-1 rounded-full ${
                  currentStep === index + 1 
                    ? 'bg-primary' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="mr-auto"
            >
              Back
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="mr-auto"
            >
              Skip Tour
            </Button>
          )}
          
          <Button 
            onClick={handleNext}
            className="ml-auto"
          >
            {currentStep < steps.length ? 'Next' : 'Finish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};