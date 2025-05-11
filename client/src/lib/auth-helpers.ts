/**
 * Auth Helper Functions
 * Shared utilities for authentication related operations
 */

/**
 * Store a redirect URL in localStorage for use after authentication
 * @param url The URL to redirect to after login
 */
export function saveRedirectUrl(url: string | null): void {
  if (url) {
    console.log(`Saving redirect URL: ${url}`);
    localStorage.setItem('auth_redirect_url', url);
  }
}

/**
 * Get the stored redirect URL from localStorage and clear it
 * @returns The stored redirect URL or null if none exists
 */
export function getAndClearRedirectUrl(): string | null {
  const redirectUrl = localStorage.getItem('auth_redirect_url');
  if (redirectUrl) {
    localStorage.removeItem('auth_redirect_url');
  }
  return redirectUrl;
}

/**
 * Process a redirect after login/authentication
 * Checks localStorage for a saved redirect URL and navigates accordingly
 * @param defaultPath Default path to navigate to if no redirect URL is found
 */
export function handleAuthRedirect(defaultPath = '/quotes'): void {
  // Get and clear the redirect URL from localStorage
  const redirectUrl = getAndClearRedirectUrl();
  
  // Navigate to the appropriate URL with a delay to ensure session is established
  setTimeout(() => {
    if (redirectUrl) {
      console.log(`Redirecting to saved URL after authentication: ${redirectUrl}`);
      window.location.href = redirectUrl;
    } else {
      console.log(`No redirect URL found, going to default path: ${defaultPath}`);
      window.location.href = defaultPath;
    }
  }, 800); // Increased delay to ensure session is established
}

/**
 * Parse URL parameters to find and store any redirect parameter
 */
export function parseAndStoreRedirectParam(): void {
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get('redirect');
  
  if (redirectParam) {
    saveRedirectUrl(redirectParam);
    console.log(`Stored redirect parameter from URL: ${redirectParam}`);
  }
}