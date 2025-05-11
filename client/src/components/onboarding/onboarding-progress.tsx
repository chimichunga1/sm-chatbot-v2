import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { useOnboardingStore } from '@/lib/onboarding';
import { Trophy } from 'lucide-react';

export function OnboardingProgress() {
  const {
    tutorialCompleted,
    dashboardSeen,
    quotesSeen,
    trainingSeen,
    usersSeen,
    settingsSeen,
    adminSeen
  } = useOnboardingStore();

  // Calculate progress percentage
  const progress = useMemo(() => {
    // Start with 1 for tutorial completion
    let totalSteps = 1;
    let completedSteps = tutorialCompleted ? 1 : 0;
    
    // Add 1 step for each section
    totalSteps += 5; // Dashboard, Quotes, Training, Users, Settings
    completedSteps += dashboardSeen ? 1 : 0;
    completedSteps += quotesSeen ? 1 : 0;
    completedSteps += trainingSeen ? 1 : 0;
    completedSteps += usersSeen ? 1 : 0;
    completedSteps += settingsSeen ? 1 : 0;
    
    // Admin is optional and only for admin users
    if (adminSeen !== undefined) {
      totalSteps += 1;
      completedSteps += adminSeen ? 1 : 0;
    }
    
    return Math.round((completedSteps / totalSteps) * 100);
  }, [
    tutorialCompleted,
    dashboardSeen,
    quotesSeen,
    trainingSeen,
    usersSeen,
    settingsSeen,
    adminSeen
  ]);

  // If the user has completed all steps, don't show the progress bar
  if (progress === 100) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Your Onboarding Progress</h3>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          {progress}% Complete
        </span>
      </div>
      
      <Progress value={progress} className="h-2 mb-2" />
      
      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
        <Trophy className="h-3 w-3 text-amber-500" />
        <span>Explore all sections to complete your onboarding</span>
      </div>
    </div>
  );
}