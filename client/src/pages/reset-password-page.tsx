/**
 * Reset Password Page
 * Handles the password reset process when user clicks the link from the email
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
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

// Reset password form schema
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [token, setToken] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<'initial' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setResetStatus('error');
      setErrorMessage("Invalid reset link. Please request a new password reset.");
      return;
    }
    
    setToken(tokenParam);
  }, []);
  
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/auth/reset-password/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      
      setResetStatus('success');
      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      setResetStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while resetting your password");
      toast({
        title: "Failed to reset password",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoToLogin = () => {
    navigate("/auth");
  };
  
  // Show error state if there's an issue with the token
  if (resetStatus === 'error') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Password Reset Failed</CardTitle>
            <CardDescription>
              {errorMessage || "There was a problem processing your request."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleGoToLogin} className="w-full">
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show success state after password is reset
  if (resetStatus === 'success') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been updated successfully. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Main form for password reset
  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Please enter a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} />
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
                    Updating Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}