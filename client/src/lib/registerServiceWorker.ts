export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered: ', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed: ', error);
        });
    });
  }
}

// Helper for detecting "Add to Home Screen" eligibility
export function isPWAInstallable() {
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  // Check for iOS standalone capability
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Check for Android & Chrome
  const isAndroid = /android/i.test(navigator.userAgent);
  const isChrome = /chrome/i.test(navigator.userAgent) && /google inc/.test(navigator.vendor.toLowerCase());
  
  // Return true if the device is iOS with Safari, or Android with Chrome
  return (isIOS && isSafari) || (isAndroid && isChrome);
}

// Check if the app is running in standalone mode (installed)
export function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}