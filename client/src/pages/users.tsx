import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Filter,
  Mail,
  UserCog,
  Shield,
  MoreHorizontal,
  Check,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema for new user form
const newUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "member", "admin"], {
    required_error: "Please select a user role",
  }),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function UsersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users`);
      return await response.json();
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: NewUserFormValues) => {
      const response = await apiRequest('POST', '/api/users', {
        ...data,
        companyId: (user as any)?.companyId || null,
        isActive: true
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User invited",
        description: "User has been invited successfully",
      });
      setInviteDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to invite user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/users/${id}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "User status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number, role: string }) => {
      const response = await apiRequest('PATCH', `/api/users/${id}`, { role });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "User role has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update user details mutation
  const updateUserDetailsMutation = useMutation({
    mutationFn: async (data: { id: number, name: string, email: string, avatarUrl?: string, role: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PATCH', `/api/users/${id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "User details have been updated successfully",
      });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // New user form
  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      role: "member",
    },
  });

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Check if user is admin
  const isAdmin = user.role === "admin";

  // Handle form submission
  const onSubmit = (data: NewUserFormValues) => {
    createUserMutation.mutate(data);
  };

  // Filter users based on search and filters
  const filteredUsers = users?.filter((u) => {
    // Only show admin users to other admins
    if (u.role === "admin" && user.role !== "admin") {
      return false;
    }
    
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && u.isActive) || 
      (statusFilter === "inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Users">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout title="Users">
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-4">Error loading users</h2>
          <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/users'] })} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Users">
      {/* Action bar with white background */}
      <div className="bg-background py-4 px-6 border-b mb-6">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          <div className="flex gap-4 items-center">
            <div className="relative w-[260px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="member">Team Member</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite User
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account for your team.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter user's full name" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter user's email address" 
                              type="email" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter username" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter temporary password" 
                              type="password" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Users can change their password after logging in.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="member">Team Member</SelectItem>
                              {isAdmin && (
                                <SelectItem value="admin">Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Owners can manage company settings, Team Members have limited access, and Admins can manage all system settings.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="gap-2 mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setInviteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Create User
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      {currentUser && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={currentUser.avatarUrl || ""} alt={currentUser.name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">
                    {getUserInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input 
                    id="edit-name" 
                    defaultValue={currentUser.name}
                    onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    defaultValue={currentUser.email}
                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select 
                    defaultValue={currentUser.role}
                    onValueChange={(value) => setCurrentUser({...currentUser, role: value})}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="member">Team Member</SelectItem>
                      {isAdmin && (
                        <SelectItem value="admin">Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateUserDetailsMutation.mutate({
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    role: currentUser.role,
                    avatarUrl: currentUser.avatarUrl || undefined
                  });
                }}
                disabled={updateUserDetailsMutation.isPending}
              >
                {updateUserDetailsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Main content with user cards */}
      <div className="bg-background p-6 rounded-none min-h-[calc(100vh-12rem)]">
        <div className="max-w-screen-xl mx-auto">
          {/* User cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="border overflow-hidden">
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between">
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>

                    <Badge variant="outline">
                      {u.role === "admin" ? "Admin" : u.role === "owner" ? "Owner" : "Team Member"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.avatarUrl || ""} alt={u.name} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getUserInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{u.name}</h3>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center mt-4 justify-between">
                    <span>Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</span>

                    {isAdmin && u.id !== user.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => {
                            setCurrentUser(u);
                            setEditDialogOpen(true);
                          }}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {u.isActive ? (
                            <DropdownMenuItem 
                              onClick={() => updateUserStatusMutation.mutate({ id: u.id, isActive: false })}
                              disabled={updateUserStatusMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => updateUserStatusMutation.mutate({ id: u.id, isActive: true })}
                              disabled={updateUserStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty state */}
            {filteredUsers.length === 0 && (
              <div className="col-span-full p-12 text-center">
                <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  No users match your current search and filter criteria.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}