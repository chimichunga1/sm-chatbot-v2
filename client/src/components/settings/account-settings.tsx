import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, User as UserIcon } from "lucide-react";

// Form schema for account settings
const accountFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Get current user data
  const { data: userData } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/status'],
  });
  
  const user = userData?.user;
  
  // Get company data
  const { data: companyData } = useQuery<{ id: number, name: string, isActive: boolean }>({
    queryKey: ['/api/companies', user?.companyId],
    enabled: !!user?.companyId,
  });
  
  const company = companyData;
  
  // Default form values
  const defaultValues: Partial<AccountFormValues> = {
    name: user?.name || "",
    email: user?.email || "",
    companyName: company?.name || "Your Company",
  };
  
  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingAvatar(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("avatar", file);
      
      // Upload avatar
      const response = await fetch(`/api/users/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }
      
      const data = await response.json();
      
      // Update user with new avatar URL
      await apiRequest("PUT", `/api/users/${user.id}`, {
        avatarUrl: data.avatarUrl,
      });
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });
  
  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.setValue("name", user.name);
      form.setValue("email", user.email);
    }
    
    if (company?.name) {
      form.setValue("companyName", company.name);
    }
  }, [user, company, form]);
  
  const onSubmit = async (data: AccountFormValues) => {
    setIsLoading(true);
    
    try {
      if (user) {
        // Update user
        await apiRequest("PUT", `/api/users/${user.id}`, {
          name: data.name,
          email: data.email,
        });
        
        // Update company if needed
        if (user.companyId && company && company.name !== data.companyName) {
          await apiRequest("PUT", `/api/companies/${user.companyId}`, {
            name: data.companyName,
          });
        }
        
        toast({
          title: "Success",
          description: "Account settings updated successfully",
        });
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
        if (user.companyId) {
          queryClient.invalidateQueries({ queryKey: ['/api/companies', user.companyId] });
        }
      }
    } catch (error) {
      console.error("Error updating account settings:", error);
      toast({
        title: "Error",
        description: "Failed to update account settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-white shadow overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="sm:col-span-6">
                <FormLabel className="block text-sm font-medium text-gray-700">Profile Picture</FormLabel>
                <div className="mt-1 flex items-center">
                  <Avatar className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt="Profile picture" />
                    ) : (
                      <AvatarFallback>
                        <UserIcon className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-5"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Change Picture
                      </>
                    )}
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Recommended: Square image, max 2MB
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
