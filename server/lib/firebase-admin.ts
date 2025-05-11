import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Important: The environment variables were swapped - fixing them here
// VITE_FIREBASE_APP_ID should be the project ID
// VITE_FIREBASE_PROJECT_ID should be the app ID
const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_APP_ID || "pricerapp-1fd78",
};

// Initialize Firebase Admin
let app;
try {
  app = initializeApp(firebaseConfig, "pricewith-ai-admin");
  console.log("Firebase Admin initialized successfully with project ID:", firebaseConfig.projectId);
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  // If we're already initialized, try to recover
  try {
    app = initializeApp(undefined, "pricewith-ai-admin");
    console.log("Using existing Firebase Admin app");
  } catch (nestedError) {
    console.error("Fatal error initializing Firebase Admin:", nestedError);
    throw nestedError;
  }
}

export const auth = getAuth(app);

// Verify Firebase ID token
export async function verifyFirebaseToken(idToken: string) {
  try {
    // For development environment with SKIP_FIREBASE_AUTH flag
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_FIREBASE_AUTH === 'true') {
      console.warn('⚠️ WARNING: Skipping Firebase token verification in development mode');
      // Return a mock decoded token
      return { 
        uid: idToken.substring(0, 20), // Just use part of the token as a fake UID
        email: 'dev@example.com'
      };
    }
    
    // In development, we'll still try to verify but provide more debug info on failure
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("Firebase token verified successfully for user:", decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    
    // In development, provide more information to help debug
    if (process.env.NODE_ENV === 'development') {
      console.log("Firebase verification failed. To skip verification for development, set SKIP_FIREBASE_AUTH=true");
      console.log("Error details:", error);
    }
    
    throw new Error('Invalid Firebase ID token');
  }
}