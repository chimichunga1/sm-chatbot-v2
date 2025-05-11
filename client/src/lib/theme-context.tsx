/**
 * Theme Context
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 */
import { createContext, useState, useContext, useEffect, type ReactNode } from '@/lib/react-compat';

// Define theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeVariant = 'tint' | 'professional' | 'vibrant';

// Theme state interface
export interface ThemeState {
  mode: ThemeMode;
  variant: ThemeVariant;
  primary: string;
  radius: number;
}

// Theme context interface
interface ThemeContextType {
  theme: ThemeState;
  setTheme: (theme: Partial<ThemeState>) => void;
  toggleMode: () => void;
  applyTheme: (theme: ThemeState) => void;
}

// Default theme settings
const defaultTheme: ThemeState = {
  mode: 'system',
  variant: 'tint',
  primary: 'hsl(142 70% 30%)',
  radius: 0.4,
};

// Predefined themes
export const themePresets = {
  green: {
    primary: 'hsl(142 70% 30%)',
    variant: 'tint' as ThemeVariant,
  },
  blue: {
    primary: 'hsl(221 83% 53%)',
    variant: 'tint' as ThemeVariant,
  },
  purple: {
    primary: 'hsl(262 83% 58%)',
    variant: 'tint' as ThemeVariant,
  },
  orange: {
    primary: 'hsl(24 75% 50%)',
    variant: 'tint' as ThemeVariant,
  },
  slate: {
    primary: 'hsl(215 25% 27%)',
    variant: 'professional' as ThemeVariant,
  },
  vibrant: {
    primary: 'hsl(326 100% 50%)',
    variant: 'vibrant' as ThemeVariant,
  },
};

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme state
  const [theme, setThemeState] = useState<ThemeState>(() => {
    // Try to load from localStorage
    const savedTheme = localStorage.getItem('pb-theme');
    if (savedTheme) {
      try {
        return JSON.parse(savedTheme);
      } catch (e) {
        console.error('Failed to parse saved theme:', e);
      }
    }
    return defaultTheme;
  });

  // Update theme and save to localStorage
  const applyTheme = (newTheme: ThemeState) => {
    setThemeState(newTheme);
    localStorage.setItem('pb-theme', JSON.stringify(newTheme));
    
    // Update theme.json on the server
    fetch('/api/settings/theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTheme),
    }).catch(err => console.error('Failed to update theme on server:', err));
    
    // Apply theme attributes to document
    document.documentElement.setAttribute('data-theme-mode', newTheme.mode);
    document.documentElement.setAttribute('data-theme-variant', newTheme.variant);
    
    // Apply CSS variables for smooth transitions
    document.documentElement.style.setProperty('--theme-primary', newTheme.primary);
    document.documentElement.style.setProperty('--theme-radius', `${newTheme.radius}rem`);
  };

  // Update partial theme settings
  const setTheme = (partial: Partial<ThemeState>) => {
    const newTheme = { ...theme, ...partial };
    applyTheme(newTheme);
  };

  // Toggle between light and dark modes
  const toggleMode = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(theme.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme({ mode: modes[nextIndex] });
  };

  // Initial theme application
  useEffect(() => {
    applyTheme(theme);
    
    // Setup system theme listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme.mode === 'system') {
        document.documentElement.setAttribute(
          'data-theme-mode', 
          mediaQuery.matches ? 'dark' : 'light'
        );
      }
    };
    
    // Apply initial system preference if needed
    if (theme.mode === 'system') {
      document.documentElement.setAttribute(
        'data-theme-mode', 
        mediaQuery.matches ? 'dark' : 'light'
      );
    }
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode]);

  // Provide the theme context
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleMode, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}