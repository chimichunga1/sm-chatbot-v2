import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash, Edit, Plus, Building, CheckCircle2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

type Industry = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function IndustryManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [newIndustry, setNewIndustry] = useState({
    name: "",
    description: "",
    icon: "",
    isActive: true,
  });

  const { data: industries, isLoading } = useQuery<Industry[]>({
    queryKey: ["/api/admin/industries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/industries");
      if (!response.ok) throw new Error("Failed to fetch industries");
      return await response.json();
    },
  });

  const createIndustryMutation = useMutation({
    mutationFn: async (industry: typeof newIndustry) => {
      const response = await apiRequest("POST", "/api/admin/industries", industry);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create industry");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/industries"] });
      toast({
        title: "Success",
        description: "Industry created successfully",
      });
      setIsAddDialogOpen(false);
      setNewIndustry({
        name: "",
        description: "",
        icon: "",
        isActive: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateIndustryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<typeof newIndustry>;
    }) => {
      const response = await apiRequest("PUT", `/api/admin/industries/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update industry");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/industries"] });
      toast({
        title: "Success",
        description: "Industry updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedIndustry(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteIndustryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/industries/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete industry");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/industries"] });
      toast({
        title: "Success",
        description: "Industry deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedIndustry(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddIndustry = () => {
    if (!newIndustry.name.trim()) {
      toast({
        title: "Error",
        description: "Industry name is required",
        variant: "destructive",
      });
      return;
    }
    
    createIndustryMutation.mutate(newIndustry);
  };

  const handleUpdateIndustry = () => {
    if (!selectedIndustry) return;
    
    updateIndustryMutation.mutate({
      id: selectedIndustry.id,
      data: {
        name: selectedIndustry.name,
        description: selectedIndustry.description || "",
        icon: selectedIndustry.icon || "",
        isActive: selectedIndustry.isActive,
      },
    });
  };

  const handleDeleteIndustry = () => {
    if (!selectedIndustry) return;
    deleteIndustryMutation.mutate(selectedIndustry.id);
  };

  const toggleIndustryStatus = (industry: Industry) => {
    updateIndustryMutation.mutate({
      id: industry.id,
      data: { isActive: !industry.isActive },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Industry Management</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Industry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {industries?.map((industry) => (
          <Card key={industry.id} className={industry.isActive ? "" : "opacity-70"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{industry.name}</CardTitle>
                  <CardDescription>
                    {new Date(industry.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedIndustry(industry);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedIndustry(industry);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {industry.description || "No description"}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={industry.isActive}
                  onCheckedChange={() => toggleIndustryStatus(industry)}
                />
                <span className="text-sm">
                  {industry.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!industries || industries.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No industries found</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Industry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Industry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Industry</DialogTitle>
            <DialogDescription>
              Create a new industry that can be associated with system prompts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Industry Name</Label>
              <Input
                id="name"
                placeholder="e.g., Painting, Construction, Web Design"
                value={newIndustry.name}
                onChange={(e) =>
                  setNewIndustry({ ...newIndustry, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this industry"
                value={newIndustry.description}
                onChange={(e) =>
                  setNewIndustry({ ...newIndustry, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                placeholder="Icon name or class"
                value={newIndustry.icon}
                onChange={(e) =>
                  setNewIndustry({ ...newIndustry, icon: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={newIndustry.isActive}
                onCheckedChange={(checked) =>
                  setNewIndustry({ ...newIndustry, isActive: checked })
                }
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIndustry} disabled={createIndustryMutation.isPending}>
              {createIndustryMutation.isPending ? "Creating..." : "Create Industry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Industry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Industry</DialogTitle>
            <DialogDescription>
              Update industry details and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedIndustry && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Industry Name</Label>
                <Input
                  id="edit-name"
                  value={selectedIndustry.name}
                  onChange={(e) =>
                    setSelectedIndustry({
                      ...selectedIndustry,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedIndustry.description || ""}
                  onChange={(e) =>
                    setSelectedIndustry({
                      ...selectedIndustry,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Input
                  id="edit-icon"
                  value={selectedIndustry.icon || ""}
                  onChange={(e) =>
                    setSelectedIndustry({
                      ...selectedIndustry,
                      icon: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={selectedIndustry.isActive}
                  onCheckedChange={(checked) =>
                    setSelectedIndustry({
                      ...selectedIndustry,
                      isActive: checked,
                    })
                  }
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateIndustry} disabled={updateIndustryMutation.isPending}>
              {updateIndustryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Industry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this industry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedIndustry && (
              <p className="font-medium">
                Industry: <span className="text-destructive">{selectedIndustry.name}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteIndustry}
              disabled={deleteIndustryMutation.isPending}
            >
              {deleteIndustryMutation.isPending ? "Deleting..." : "Delete Industry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default IndustryManagement;