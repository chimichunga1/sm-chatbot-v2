import { useState } from 'react';
import { useTheme, themePresets, ThemeVariant, ThemeMode } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sun,
  Moon,
  MonitorSmartphone,
  PaintBucket,
  Circle,
  SlidersHorizontal,
} from 'lucide-react';

// Color option component
function ColorOption({ 
  color, 
  isSelected, 
  onClick 
}: { 
  color: string; 
  isSelected: boolean; 
  onClick: () => void 
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`
              relative w-8 h-8 rounded-full transition-transform 
              ${isSelected ? 'ring-2 ring-black dark:ring-white ring-offset-2 scale-110' : 'hover:scale-105'}
            `}
            style={{ backgroundColor: color }}
            onClick={onClick}
          >
            {isSelected && (
              <Circle className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-md" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{color}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ThemeSwitcher button with popover
export function ThemeSwitcher() {
  const { theme, setTheme, toggleMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Handle theme variant change
  const handleVariantChange = (variant: ThemeVariant) => {
    setTheme({ variant });
  };

  // Handle theme mode change
  const handleModeChange = (mode: ThemeMode) => {
    setTheme({ mode });
  };

  // Handle corner radius change
  const handleRadiusChange = (value: number[]) => {
    setTheme({ radius: value[0] });
  };

  // Handle preset theme selection
  const handlePresetSelect = (preset: keyof typeof themePresets) => {
    setTheme(themePresets[preset]);
  };

  // Get icon based on current theme mode
  const getModeIcon = () => {
    switch (theme.mode) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <MonitorSmartphone className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <PaintBucket className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Appearance</h4>
          
          {/* Theme Mode Tabs */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Mode</p>
            <Tabs 
              value={theme.mode}
              onValueChange={(value) => handleModeChange(value as ThemeMode)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="light" className="flex items-center gap-1">
                  <Sun className="h-4 w-4" />
                  <span className="hidden sm:inline">Light</span>
                </TabsTrigger>
                <TabsTrigger value="dark" className="flex items-center gap-1">
                  <Moon className="h-4 w-4" />
                  <span className="hidden sm:inline">Dark</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1">
                  <MonitorSmartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">System</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Theme Variant Tabs */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Style</p>
            <Tabs
              value={theme.variant}
              onValueChange={(value) => handleVariantChange(value as ThemeVariant)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="tint">Default</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="vibrant">Vibrant</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Color Presets */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Color</p>
            <div className="flex flex-wrap gap-2 justify-between">
              <ColorOption
                color={themePresets.green.primary}
                isSelected={theme.primary === themePresets.green.primary}
                onClick={() => handlePresetSelect('green')}
              />
              <ColorOption
                color={themePresets.blue.primary}
                isSelected={theme.primary === themePresets.blue.primary}
                onClick={() => handlePresetSelect('blue')}
              />
              <ColorOption
                color={themePresets.purple.primary}
                isSelected={theme.primary === themePresets.purple.primary}
                onClick={() => handlePresetSelect('purple')}
              />
              <ColorOption
                color={themePresets.orange.primary}
                isSelected={theme.primary === themePresets.orange.primary}
                onClick={() => handlePresetSelect('orange')}
              />
              <ColorOption
                color={themePresets.slate.primary}
                isSelected={theme.primary === themePresets.slate.primary}
                onClick={() => handlePresetSelect('slate')}
              />
              <ColorOption
                color={themePresets.vibrant.primary}
                isSelected={theme.primary === themePresets.vibrant.primary}
                onClick={() => handlePresetSelect('vibrant')}
              />
            </div>
          </div>
          
          {/* Radius Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Roundness</p>
              <span className="text-xs text-muted-foreground">{theme.radius.toFixed(1)}</span>
            </div>
            <Slider
              value={[theme.radius]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={handleRadiusChange}
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Square</span>
              <span>Round</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Simple floating theme toggle button for mobile
export function FloatingThemeToggle() {
  const { toggleMode, theme } = useTheme();
  
  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-20 right-4 z-50 h-10 w-10 rounded-full shadow-lg bg-background border-primary md:hidden"
      onClick={toggleMode}
    >
      {theme.mode === 'light' ? (
        <Sun className="h-5 w-5" />
      ) : theme.mode === 'dark' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <MonitorSmartphone className="h-5 w-5" />
      )}
    </Button>
  );
}