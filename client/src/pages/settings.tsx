/**
 * Settings Page Component
 * Refactored to use the React compatibility layer for forward compatibility with React 19
 */
import { useState, useEffect } from "@/lib/react-compat";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Laptop,
  CreditCard,
  LogOut,
  Save,
  Upload,
  RefreshCw,
  Link,
  Check,
  X,
  ExternalLink
} from "lucide-react";
import xeroLogo from "@/assets/xero-logo-new.svg";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

// Xero integration component
const XeroIntegration = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<string | null>(null);

  // Check if already connected when component loads
  useEffect(() => {
    const checkXeroConnection = async () => {
      try {
        const response = await fetch('/api/xero/status', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.connected) {
            setIsConnected(true);
            setOrganization(data.organization || 'Your Organization');
          }
        }
      } catch (error) {
        console.error('Error checking Xero connection:', error);
      }
    };
    
    checkXeroConnection();
    
    // Check for connection status from URL parameters
    const params = new URLSearchParams(window.location.search);
    const xeroStatus = params.get('xero');
    if (xeroStatus === 'connected') {
      setIsConnected(true);
      toast({
        title: "Connected to Xero",
        description: "Your Xero account has been successfully connected",
        duration: 3000,
      });
    } else if (xeroStatus === 'error') {
      setConnectionError('Failed to connect to Xero.');
      toast({
        title: "Connection Failed",
        description: "There was a problem connecting to Xero. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [toast]);
  
  const handleConnect = () => {
    setIsLoading(true);
    setConnectionError(null);
    
    // First get the auth URL
    fetch('/api/xero/auth-url', {
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to get Xero authorization URL');
      }
      return response.json();
    })
    .then(data => {
      // Redirect to Xero for authorization
      window.location.href = data.url;
    })
    .catch(error => {
      console.error('Error connecting to Xero:', error);
      setConnectionError('Failed to connect to Xero.');
      setIsLoading(false);
    });
  };
  
  const handleDisconnect = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/xero/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsConnected(false);
        setOrganization(null);
        toast({
          title: "Disconnected from Xero",
          description: "Your Xero account has been disconnected",
          duration: 3000,
        });
      } else {
        throw new Error('Failed to disconnect from Xero');
      }
    } catch (error) {
      console.error('Error disconnecting from Xero:', error);
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect from Xero",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#00B9E9]">
              <img src={xeroLogo} alt="Xero Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <CardTitle className="text-lg mb-0.5">Xero Integration</CardTitle>
              <div className="flex items-center">
                <Badge 
                  variant={isConnected ? "default" : "outline"}
                  className={isConnected 
                    ? "bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20" 
                    : ""
                  }
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                {isConnected && (
                  <span className="text-xs text-muted-foreground ml-2">
                    • Synced with Xero
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        {isConnected ? (
          <div>
            {/* Organization info with improved styling */}
            {organization && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground font-normal">Connected Account</Label>
                    <p className="text-sm font-medium">{organization}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Feature list with check marks */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Features Enabled</Label>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Quote export to Xero</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Client data synchronization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Automatic invoice creation</span>
                </li>
              </ul>
            </div>
            
            {/* Actions with improved layout */}
            <div className="flex gap-2 mt-5">
              <Button 
                variant="outline" 
                size="sm"
                className="flex gap-1.5 flex-1 justify-center"
                onClick={() => window.open("https://go.xero.com/Dashboard", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open Xero Dashboard
              </Button>
              
              <Button 
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show error message if connection failed */}
            {connectionError && (
              <Alert variant="destructive">
                <p className="text-sm">
                  {connectionError} Please contact support if this issue persists.
                </p>
              </Alert>
            )}
            
            <p className="text-sm text-muted-foreground">
              Connect your Xero account to automatically export quotes. 
              This allows you to:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                Export quotes directly to Xero
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                Sync clients between platforms
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                Track quote status automatically
              </li>
            </ul>
            
            <Button 
              className="w-full mt-2"
              style={{ backgroundColor: "#00B9E9", color: "black" }}
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect to Xero"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Handle logout with forced redirection
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out."
      });
      // Force navigation to auth page with window.location for a full page refresh
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      // Even on error, redirect to auth page
      window.location.href = "/auth";
    }
  };
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    emailNotifications: true,
    appNotifications: true,
    twoFactorAuth: false,
    darkMode: true,
    avatarUrl: user?.avatarUrl || null
  });
  
  // Company form state - populate with company data if available
  const [companyData, setCompanyData] = useState({
    companyName: "",
    industry: "",
    logo: "",
  });
  
  // Load company data when available
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (user?.companyId) {
        try {
          const response = await fetch(`/api/companies/${user.companyId}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const company = await response.json();
            setCompanyData({
              companyName: company.name || "",
              industry: company.industry || "",
              logo: company.logo || "",
            });
          }
        } catch (error) {
          console.error("Error fetching company data:", error);
        }
      }
    };
    
    fetchCompanyData();
  }, [user?.companyId]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  // Handle toggle change
  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle company input change
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit for user profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Log the data being sent for debugging
      console.log("Sending profile data:", {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl ? `${formData.avatarUrl.substring(0, 30)}...` : null
      });
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' 
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          avatarUrl: formData.avatarUrl
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const data = await response.json();
      console.log("Profile update response:", data);
      
      // Update user in context with new name or other fields
      updateUser({
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Handle form submit for company
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update company information');
      }
      
      const data = await response.json();
      toast({
        title: "Company Updated",
        description: "Your company information has been updated successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update company information",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user.name) return "U";
    return user.name
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6 max-w-screen-xl mx-auto px-4 md:px-6">
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mobile tabs selector - optimized for iPhone 16 */}
          <div className="block lg:hidden mb-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full mb-6 p-1 h-12 bg-gray-100 gap-1">
                <TabsTrigger 
                  value="profile" 
                  className="flex flex-col items-center justify-center h-full rounded-md data-[state=active]:bg-black data-[state=active]:text-white transition-all"
                >
                  <User className="h-4 w-4 mb-0.5" />
                  <span className="text-[10px] font-medium">Profile</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="billing" 
                  className="flex flex-col items-center justify-center h-full rounded-md data-[state=active]:bg-black data-[state=active]:text-white transition-all"
                >
                  <CreditCard className="h-4 w-4 mb-0.5" />
                  <span className="text-[10px] font-medium">Billing</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="integrations" 
                  className="flex flex-col items-center justify-center h-full rounded-md data-[state=active]:bg-black data-[state=active]:text-white transition-all"
                >
                  <Link className="h-4 w-4 mb-0.5" />
                  <span className="text-[10px] font-medium">Integrations</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Desktop sidebar - hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1 max-w-[220px]">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Tabs 
                  defaultValue={activeTab} 
                  onValueChange={setActiveTab}
                  orientation="vertical" 
                  className="w-full"
                >
                  <TabsList className="flex flex-col h-auto w-full bg-transparent justify-start p-0 rounded-md">
                    <TabsTrigger 
                      value="profile" 
                      className="justify-start py-2 px-3 gap-2 rounded-md border-transparent text-sm data-[state=active]:bg-black data-[state=active]:text-white"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </TabsTrigger>

                    <TabsTrigger 
                      value="integrations" 
                      className="justify-start py-2 px-3 gap-2 rounded-md border-transparent text-sm data-[state=active]:bg-black data-[state=active]:text-white"
                    >
                      <Link className="h-4 w-4" />
                      Integrations
                    </TabsTrigger>
                    <TabsTrigger 
                      value="billing" 
                      className="justify-start py-2 px-3 gap-2 rounded-md border-transparent text-sm data-[state=active]:bg-black data-[state=active]:text-white"
                    >
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Separator className="my-4" />
                
                <div className="px-3 pb-3 mt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center py-2 px-3 gap-2 rounded-md text-sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Settings content */}
          <div className="lg:col-span-3 w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="profile" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account profile information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <Avatar className="h-24 w-24 border-4 border-muted">
                          <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                          <AvatarFallback className="bg-black text-white text-2xl">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Show the image upload dialog
                                const fileInput = document.createElement('input');
                                fileInput.type = 'file';
                                fileInput.accept = 'image/*';
                                fileInput.onchange = async (e: any) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 2 * 1024 * 1024) { // 2MB max
                                      toast({
                                        title: "File too large",
                                        description: "Please select an image under 2MB",
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    
                                    // Show a notification about square image
                                    toast({
                                      title: "Profile Photo",
                                      description: "For best results, use a square image. We'll crop your image to a circle.",
                                      duration: 5000
                                    });
                                    
                                    // Create a FormData object and append the file
                                    const formData = new FormData();
                                    formData.append('avatar', file);
                                    
                                    try {
                                      // Upload the file to the server using our new API endpoint
                                      const response = await fetch('/api/profile/upload-avatar', {
                                        method: 'POST',
                                        body: formData,
                                        credentials: 'include'
                                      });
                                      
                                      if (!response.ok) {
                                        toast({
                                          title: "Upload Failed",
                                          description: "Failed to upload profile photo",
                                          variant: "destructive"
                                        });
                                        throw new Error('Failed to upload profile photo');
                                      }
                                      
                                      const data = await response.json();
                                      console.log("Upload success:", data);
                                      
                                      // Update the user context with the returned URL
                                      updateUser({
                                        avatarUrl: data.avatarUrl
                                      });
                                      
                                      // Set to form data so it gets saved on submit
                                      setFormData(prevFormData => ({
                                        ...prevFormData,
                                        avatarUrl: data.avatarUrl
                                      }));
                                      
                                      toast({
                                        title: "Upload Success",
                                        description: "Profile photo uploaded successfully",
                                        duration: 3000,
                                      });
                                    } catch (error) {
                                      console.error("Error uploading avatar:", error);
                                      toast({
                                        title: "Upload Failed",
                                        description: error instanceof Error ? error.message : "An unknown error occurred",
                                        variant: "destructive",
                                        duration: 5000,
                                      });
                                    }
                                  }
                                };
                                fileInput.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Change Photo
                            </Button>
                            {user.avatarUrl && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500"
                                onClick={() => {
                                  // Update the user context
                                  updateUser({
                                    avatarUrl: null
                                  });
                                  
                                  // Set to form data so it gets saved on submit
                                  setFormData(prevFormData => ({
                                    ...prevFormData,
                                    avatarUrl: null
                                  }));
                                  
                                  toast({
                                    title: "Photo Removed",
                                    description: "Your profile photo has been removed"
                                  });
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={handleChange}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Your email address"
                            value={formData.email}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>
                      Update your company details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCompanySubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            placeholder="Your company name"
                            value={companyData.companyName}
                            onChange={handleCompanyChange}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <select 
                            id="industry" 
                            name="industry"
                            value={companyData.industry}
                            onChange={handleCompanyChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select an industry</option>
                            <option value="painting">Painting</option>
                            <option value="sign_writing">Sign Writing</option>
                            <option value="web_design">Web Design</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="companyLogo">Company Logo</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 border rounded-md flex items-center justify-center bg-muted">
                            {companyData.logo ? (
                              <img 
                                src={companyData.logo} 
                                alt="Company logo" 
                                className="h-full w-full object-contain p-1" 
                              />
                            ) : (
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Show the logo upload dialog
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.accept = 'image/*';
                              fileInput.onchange = async (e: any) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) { // 2MB max
                                    toast({
                                      title: "File too large",
                                      description: "Please select an image under 2MB",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  
                                  // Show logo recommendation
                                  toast({
                                    title: "Company Logo",
                                    description: "For best results, use a square or rectangular logo with transparent background.",
                                    duration: 5000
                                  });
                                  
                                  // Create a FormData object and append the file
                                  const formData = new FormData();
                                  formData.append('logo', file);
                                  
                                  try {
                                    // Upload the file to the server using our new API endpoint
                                    const response = await fetch('/api/company/upload-logo', {
                                      method: 'POST',
                                      body: formData,
                                      credentials: 'include'
                                    });
                                    
                                    if (!response.ok) {
                                      toast({
                                        title: "Upload Failed",
                                        description: "Failed to upload company logo",
                                        variant: "destructive"
                                      });
                                      throw new Error('Failed to upload company logo');
                                    }
                                    
                                    const data = await response.json();
                                    console.log("Logo upload success:", data);
                                    
                                    // Update the company data with the returned URL
                                    setCompanyData({
                                      ...companyData,
                                      logo: data.logo
                                    });
                                    
                                    toast({
                                      title: "Upload Success",
                                      description: "Company logo uploaded successfully",
                                      duration: 3000,
                                    });
                                  } catch (error) {
                                    console.error("Error uploading logo:", error);
                                    toast({
                                      title: "Upload Failed",
                                      description: error instanceof Error ? error.message : "An unknown error occurred",
                                      variant: "destructive",
                                      duration: 5000,
                                    });
                                  }
                                }
                              };
                              fileInput.click();
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </Button>
                        </div>
                      </div>
                      
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Save Company Info
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="integrations" className="m-0 space-y-6">
                <XeroIntegration />
              </TabsContent>
              
              <TabsContent value="billing" className="m-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription & Billing</CardTitle>
                    <CardDescription>
                      Manage your subscription and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Current Plan</h3>
                      <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">Early Adopter Program</h4>
                            <p className="text-sm text-muted-foreground">
                              You're part of our exclusive early adopter program with special pricing.
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Payments</h3>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center">
                          <div>
                            <h4 className="font-semibold">Beta Program</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              We are currently in Beta. So no payments are due until we go live.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Billing History</h3>
                      </div>
                      
                      <div className="rounded-lg border">
                        <div className="relative w-full overflow-auto">
                          <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium">
                                  Date
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium">
                                  Amount
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium">
                                  Status
                                </th>
                                <th className="h-12 px-4 text-right align-middle font-medium">
                                  Invoice
                                </th>
                              </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                  No billing history available
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Payment Method</h3>
                      <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              No payment method on file
                            </p>
                          </div>
                          <Button variant="outline" size="sm" disabled>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Add Payment Method
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Logout button at the bottom for mobile (hidden on desktop) */}
        <div className="mt-8 mb-16 px-4 lg:hidden">
          <Button 
            variant="default" 
            className="w-full bg-black text-white py-6"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}