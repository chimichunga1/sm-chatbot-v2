import { useEffect } from "react";
import { useLocation } from "wouter";

// Simplified login page that redirects to the main auth page
export default function Login() {
  const [, navigate] = useLocation();
  
  // Redirect to the main auth page on mount
  useEffect(() => {
    navigate("/auth");
  }, [navigate]);
  
  // This component won't be visible because of the immediate redirect
  // But just in case there's a delay, show a loading screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">PriceBetter.ai</h1>
          <p className="text-gray-600">Redirecting to login page...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}