import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isIOS } from "@/lib/utils";

/**
 * Component for iOS PWA functionality
 * PWA functionality remains active but popup is disabled as per client request
 */
export function IosPwaInstaller() {
  // Always false - popup is disabled as requested
  const [showInstaller, setShowInstaller] = useState(false);
  
  // We still check for iOS and standalone mode for proper PWA functionality
  // but we never set showInstaller to true
  useEffect(() => {
    // Keep track of iOS Safari but don't show the popup
    if (isIOS()) {
      const nav = window.navigator as any;
      const isStandalone = nav.standalone === true || 
        window.matchMedia('(display-mode: standalone)').matches;
      
      // PWA detection logic remains for functionality
      // but we never set showInstaller to true
    }
  }, []);
  
  // If not iOS or already installed, don't show anything
  if (!showInstaller) return null;
  
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={() => setShowInstaller(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col space-y-3">
          <h3 className="font-semibold text-base">Install PriceBetter.ai</h3>
          <p className="text-sm text-gray-600">
            Add this app to your home screen for a better experience.
          </p>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                1
              </div>
              <span className="text-sm">Tap the share icon</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                2
              </div>
              <span className="text-sm">Select "Add to Home Screen"</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                3
              </div>
              <span className="text-sm">Tap "Add" in the top right</span>
            </div>
          </div>
          
          <Button 
            variant="default" 
            className="w-full bg-black text-white"
            onClick={() => setShowInstaller(false)}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}