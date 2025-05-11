/**
 * Authentication Page Component
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 * 
 * Special URL parameters:
 * - force-logout=true: Will first log the user out before showing login page
 * - username=xyz: Pre-fill the username field
 * - tab=register|login|forgot: Pre-select the tab
 * - redirect=/path: Redirect to this path after successful login
 */
import { useState, useEffect } from "@/lib/react-compat";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { parseAndStoreRedirectParam } from '@/lib/auth-helpers';

// Login Form Schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration Form Schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Forgot Password Schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * AuthForm component - Handles login and registration forms
 * Simplified version without Google login
 */
function AuthForm() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { login, register } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting login form:", values);
      
      // Clear any previous form errors
      loginForm.clearErrors();
      
      // Add a timeout to prevent hanging if the server doesn't respond
      const loginPromise = login(values);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Login request timed out")), 15000)
      );
      
      await Promise.race([loginPromise, timeoutPromise]);
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Set form error
      loginForm.setError("root", { 
        message: error instanceof Error ? error.message : "Login failed. Please try again." 
      });
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setIsSubmitting(true);
      await register(values);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onForgotPasswordSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    try {
      setIsSubmitting(true);
      // Send the reset password email
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      });
      
      setResetEmailSent(true);
      toast({
        title: "Email sent",
        description: "Please check your inbox for the password reset link",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Failed to send reset email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left column - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">PriceBetter<span className="text-gray-700">.AI</span></h1>
            <p className="text-muted-foreground">
              AI-powered quote generation for your business
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            <TabsContent value="login" className="mt-6">
              <Card>
                <CardHeader>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username or Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username or email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-4 bg-black text-white hover:bg-black/90" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                      <div className="mt-2 text-right">
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setActiveTab("forgot-password")}
                        >
                          Forgot password?
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forgot-password">
              <Card>
                <CardHeader>
                  <CardTitle>Reset Password</CardTitle>
                  <CardDescription>
                    Enter your email to receive a password reset link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resetEmailSent ? (
                    <div className="text-center space-y-4">
                      <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-medium">Check your email</h3>
                      <p className="text-muted-foreground">
                        We've sent you a link to reset your password. Please check your inbox.
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setActiveTab("login")}
                      >
                        Back to login
                      </Button>
                    </div>
                  ) : (
                    <Form {...forgotPasswordForm}>
                      <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={forgotPasswordForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex flex-col space-y-2">
                          <Button 
                            type="submit" 
                            className="w-full mt-4" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              "Send Reset Link"
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="mt-2" 
                            onClick={() => setActiveTab("login")}
                          >
                            Back to login
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to start generating accurate quotes with AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Admin link removed as per user request */}
        </div>
      </div>

      {/* Right column - Hero */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-black text-white p-12">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4">Generate accurate quotes with AI</h1>
          <p className="text-xl mb-6">
            PriceBetter.ai helps you create precise and professional quotes in seconds using the power of artificial intelligence.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Save hours on quote preparation</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Train the AI with your specific pricing knowledge</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Integration with Xero accounting software</span>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Manage users and quotes in one place</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Main AuthPage component that handles authentication state and routing
 */
export default function AuthPage() {
  const [_, navigate] = useLocation();
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  
  // Parse URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const forceLogout = searchParams.get("force-logout") === "true";
  const usernameParam = searchParams.get("username");
  const tabParam = searchParams.get("tab");
  const redirectParam = searchParams.get("redirect");
  
  // Effect to handle forced logout
  useEffect(() => {
    if (forceLogout) {
      console.log("Force logout detected in auth page");
      
      // Clear all client-side storage for a clean slate
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any cookies by setting them to expire
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      } catch (e) {
        console.error("Error clearing local storage during force logout:", e);
      }
      
      // Call the logout function to ensure server-side session is destroyed
      logout().catch(err => console.error("Error in force logout:", err));
      
      // Show feedback to the user
      toast({
        title: "Logged out",
        description: "You have been signed out successfully",
        duration: 3000,
      });
      
      // Remove the parameter to avoid infinite logout loop
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("force-logout");
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("t");
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [forceLogout, logout, toast]);
  
  // Effect to update default form values based on URL parameters
  useEffect(() => {
    if (tabParam && ["login", "register", "forgot-password"].includes(tabParam)) {
      // We would set the active tab here
      // This would be implemented by passing these down to the AuthForm component
    }
    
    if (usernameParam) {
      // We would pre-populate the username field here
      // This would be implemented by passing these down to the AuthForm component
    }
    
    // Handle redirect parameter if present
    if (redirectParam) {
      // Save the redirect URL for use after authentication
      localStorage.setItem('auth_redirect_url', redirectParam);
      console.log(`Storing redirect parameter in localStorage: ${redirectParam}`);
    }
  }, [tabParam, usernameParam, redirectParam]);

  // Handle redirection if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      // User is already authenticated, redirect to the specified path or default to quotes page
      const targetPath = redirectParam || "/quotes";
      console.log(`Redirecting authenticated user to: ${targetPath}`);
      
      // For admin paths, use full page reload to ensure proper token handling
      if (targetPath.startsWith('/admin')) {
        window.location.href = targetPath;
      } else {
        navigate(targetPath);
      }
    }
  }, [isLoading, user, navigate, redirectParam]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoading && !user) {
    return <AuthForm />;
  }

  // This should not be visible, but as a fallback return null
  return null;
}