import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Company } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getStatusBadgeColor } from "@/lib/utils";
import { Search, UserCog, Ban, Trash, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserForm } from "@/components/users/user-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });
  
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });
  
  // Filter users based on search query and company filter
  const filteredUsers = users
    ? users.filter((user) => {
        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)
          );
        }
        return true;
      }).filter((user) => {
        // Apply company filter
        if (companyFilter) {
          return user.companyId === parseInt(companyFilter);
        }
        return true;
      })
    : [];
  
  // Get company name by ID
  const getCompanyName = (companyId?: number | null) => {
    if (!companyId || !companies) return "N/A";
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : "N/A";
  };
  
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  
  const handleToggleUserStatus = async (user: User) => {
    try {
      await apiRequest("PUT", `/api/users/${user.id}`, {
        isActive: !user.isActive,
      });
      
      toast({
        title: "Success",
        description: `User ${user.isActive ? "deactivated" : "activated"} successfully`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    } catch (error) {
      console.error("Error toggling user status:", error);
      
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async (userId: number) => {
    try {
      await apiRequest("DELETE", `/api/users/${userId}`);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    } catch (error) {
      console.error("Error deleting user:", error);
      
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Card className="bg-white shadow overflow-hidden">
        <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">Registered Users</CardTitle>
          <div className="flex space-x-3">
            <div className="relative">
              <Input
                type="text"
                id="admin-search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Companies</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="loading-spinner h-6 w-6 border-2 border-primary-600 rounded-full border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Avatar>
                            <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCompanyName(user.companyId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === "owner" ? (
                        <Badge variant="outline" className="bg-yellow-50 text-amber-700 border-amber-200 flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      ) : (
                        user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.isActive ? "active" : "inactive")}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="Edit user"
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleUserStatus(user)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                        title={user.isActive ? "Deactivate user" : "Activate user"}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredUsers.length}</span> of{" "}
              <span className="font-medium">{users?.length || 0}</span> users
            </p>
          </div>
        </div>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm
            user={selectedUser || undefined}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
