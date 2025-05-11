import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Brain, 
  Users, 
  Settings as SettingsIcon,
  BarChart3,
  UserCircle
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">Here's an overview of your quote management system</p>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Quotes Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Quotes
              </CardTitle>
              <CardDescription>
                Create and manage AI-powered quotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Quotes</span>
                    <span className="font-medium">24</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/quotes")}
                  >
                    Manage Quotes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/quotes/new")}
                  >
                    Create New
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-5 w-5 text-primary" />
                Training
              </CardTitle>
              <CardDescription>
                Train AI with your business knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Training Progress</span>
                    <span className="font-medium">45%</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/training")}
                  >
                    Continue Training
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/training/results")}
                  >
                    View Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                Users
              </CardTitle>
              <CardDescription>
                {user?.role === 'admin' ? 'Manage team members and permissions' : 'View team members'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Team Members</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden">
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarFallback>AK</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarFallback>ST</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarFallback>+2</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/users")}
                  >
                    Manage Users
                  </Button>
                  {user?.role === 'admin' && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/users/invite")}
                    >
                      Invite User
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure your account and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Connected Services</span>
                    <span className="font-medium">1/3</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="bg-primary/20 h-6 rounded flex items-center justify-center text-xs">
                      Xero
                    </div>
                    <div className="bg-muted h-6 rounded flex items-center justify-center text-xs text-muted-foreground">
                      CRM
                    </div>
                    <div className="bg-muted h-6 rounded flex items-center justify-center text-xs text-muted-foreground">
                      Email
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/settings")}
                  >
                    Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/settings/profile")}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance metrics section */}
          <Card className="col-span-1 md:col-span-2 xl:col-span-4">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Performance
                  </CardTitle>
                  <CardDescription>
                    Activity overview for the last 30 days
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Last 7 Days</Button>
                  <Button variant="outline" size="sm">Last 30 Days</Button>
                  <Button size="sm">All Time</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full flex items-center justify-center border-2 border-dashed border-muted rounded-md">
                <p className="text-muted-foreground">Performance chart will be displayed here</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <DashboardStatCard 
                  title="Total Quotes" 
                  metricKey="totalQuotes" 
                  percentKey="quotesPercentChange" 
                />
                
                <DashboardStatCard 
                  title="Quote Value" 
                  metricKey="totalQuoteValue" 
                  percentKey="valuePercentChange" 
                  isCurrency={true}
                />
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <h3 className="text-2xl font-bold">32%</h3>
                  <p className="text-xs text-muted-foreground">Based on accepted quotes</p>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Training Data</p>
                  <h3 className="text-2xl font-bold">148 MB</h3>
                  <p className="text-xs text-muted-foreground">Total AI training data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}