import { create } from 'zustand';
import { apiRequest } from './queryClient';

// Define the onboarding state type
export interface OnboardingState {
  tutorialCompleted: boolean;
  currentStep: number;
  dashboardSeen: boolean;
  quotesSeen: boolean;
  trainingSeen: boolean;
  usersSeen: boolean;
  settingsSeen: boolean;
  adminSeen: boolean;
  lastActivity: Date | null;
  
  // Actions
  markTutorialCompleted: () => void;
  setCurrentStep: (step: number) => void;
  markSectionSeen: (section: 'dashboard' | 'quotes' | 'training' | 'users' | 'settings' | 'admin') => void;
  fetchOnboardingState: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Create the store
export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  // Initial state
  tutorialCompleted: false,
  currentStep: 1,
  dashboardSeen: false,
  quotesSeen: false,
  trainingSeen: false,
  usersSeen: false,
  settingsSeen: false,
  adminSeen: false,
  lastActivity: null,
  isLoading: false,
  error: null,
  
  // Actions
  markTutorialCompleted: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await updateOnboardingState({ tutorialCompleted: true });
      set({ ...data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to update onboarding state' });
    }
  },
  
  setCurrentStep: async (step: number) => {
    try {
      set({ isLoading: true, error: null });
      const data = await updateOnboardingState({ currentStep: step });
      set({ ...data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to update onboarding state' });
    }
  },
  
  markSectionSeen: async (section: 'dashboard' | 'quotes' | 'training' | 'users' | 'settings' | 'admin') => {
    const sectionMap = {
      dashboard: 'dashboardSeen',
      quotes: 'quotesSeen',
      training: 'trainingSeen',
      users: 'usersSeen',
      settings: 'settingsSeen',
      admin: 'adminSeen'
    };
    
    try {
      set({ isLoading: true, error: null });
      const data = await updateOnboardingState({ [sectionMap[section]]: true });
      set({ ...data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to update onboarding state' });
    }
  },
  
  fetchOnboardingState: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchOnboardingData();
      if (data) {
        set({
          ...data,
          isLoading: false,
          lastActivity: data.lastActivity ? new Date(data.lastActivity) : null
        });
      } else {
        // If no onboarding data exists yet, create it
        const newData = await createOnboardingData();
        set({
          ...newData,
          isLoading: false,
          lastActivity: newData.lastActivity ? new Date(newData.lastActivity) : null
        });
      }
    } catch (err) {
      set({ isLoading: false, error: 'Failed to fetch onboarding state' });
    }
  }
}));

// API functions
const fetchOnboardingData = async () => {
  try {
    const response = await apiRequest('GET', '/api/onboarding');
    return await response.json();
  } catch (err) {
    console.error('Error fetching onboarding data:', err);
    // 404 is expected if onboarding hasn't been created yet
    if (err instanceof Error && err.message.includes('404')) {
      return null;
    }
    throw err;
  }
};

const createOnboardingData = async () => {
  try {
    const data = {
      tutorialCompleted: false,
      currentStep: 1,
      dashboardSeen: false,
      quotesSeen: false,
      trainingSeen: false,
      usersSeen: false,
      settingsSeen: false,
      adminSeen: false
    };
    
    const response = await apiRequest('POST', '/api/onboarding', data);
    return await response.json();
  } catch (err) {
    console.error('Error creating onboarding data:', err);
    throw err;
  }
};

const updateOnboardingState = async (data: Partial<OnboardingState>) => {
  try {
    // Remove action methods from the data
    const { 
      markTutorialCompleted, 
      setCurrentStep, 
      markSectionSeen, 
      fetchOnboardingState,
      isLoading,
      error,
      ...onboardingData 
    } = data as any;
    
    const response = await apiRequest('PUT', '/api/onboarding', onboardingData);
    return await response.json();
  } catch (err) {
    console.error('Error updating onboarding state:', err);
    throw err;
  }
};