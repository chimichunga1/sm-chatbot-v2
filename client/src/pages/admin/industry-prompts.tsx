
import React, { useState, useEffect } from 'react';
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleAlert, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface IndustryPrompt {
  id: number;
  industryName: string;
  promptText: string;
  createdAt: string;
  updatedAt: string;
}

export default function IndustryPromptsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<IndustryPrompt | null>(null);
  const [industryName, setIndustryName] = useState('');
  const [promptText, setPromptText] = useState('');

  // Fetch industry prompts
  const industryPromptsQuery = useQuery<IndustryPrompt[]>({
    queryKey: ['/api/admin/industry-prompts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/industry-prompts');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch industry prompts');
      }
      return await response.json();
    },
  });

  // Create industry prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (data: { industryName: string; promptText: string }) => {
      const response = await apiRequest(
        'POST',
        '/api/admin/industry-prompts',
        data
      );
      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create industry prompt');
        } catch (jsonError) {
          // If response is not valid JSON
          const text = await response.text();
          throw new Error(text || 'Failed to create industry prompt');
        }
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/industry-prompts'],
      });
      toast({
        title: 'Industry prompt created',
        description: 'The industry prompt has been created successfully.',
      });
      setIsAddModalOpen(false);
      setIndustryName('');
      setPromptText('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create industry prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update industry prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (data: { id: number; industryName: string; promptText: string }) => {
      const response = await apiRequest(
        'PUT',
        `/api/admin/industry-prompts/${data.id}`,
        { industryName: data.industryName, promptText: data.promptText }
      );
      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update industry prompt');
        } catch (jsonError) {
          // If response is not valid JSON
          const text = await response.text();
          throw new Error(text || 'Failed to update industry prompt');
        }
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/industry-prompts'],
      });
      toast({
        title: 'Industry prompt updated',
        description: 'The industry prompt has been updated successfully.',
      });
      setIsEditModalOpen(false);
      setSelectedPrompt(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update industry prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete industry prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        'DELETE',
        `/api/admin/industry-prompts/${id}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete industry prompt');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/industry-prompts'],
      });
      toast({
        title: 'Industry prompt deleted',
        description: 'The industry prompt has been deleted successfully.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedPrompt(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete industry prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddPrompt = () => {
    if (!industryName.trim()) {
      toast({
        title: 'Industry name required',
        description: 'Please enter an industry name.',
        variant: 'destructive',
      });
      return;
    }

    if (!promptText.trim()) {
      toast({
        title: 'Prompt text required',
        description: 'Please enter prompt text.',
        variant: 'destructive',
      });
      return;
    }

    createPromptMutation.mutate({ industryName, promptText });
  };

  const handleEditPrompt = () => {
    if (!selectedPrompt) return;

    if (!industryName.trim()) {
      toast({
        title: 'Industry name required',
        description: 'Please enter an industry name.',
        variant: 'destructive',
      });
      return;
    }

    if (!promptText.trim()) {
      toast({
        title: 'Prompt text required',
        description: 'Please enter prompt text.',
        variant: 'destructive',
      });
      return;
    }

    updatePromptMutation.mutate({
      id: selectedPrompt.id,
      industryName,
      promptText,
    });
  };

  const handleDeletePrompt = () => {
    if (!selectedPrompt) return;
    deletePromptMutation.mutate(selectedPrompt.id);
  };

  const openEditModal = (prompt: IndustryPrompt) => {
    setSelectedPrompt(prompt);
    setIndustryName(prompt.industryName);
    setPromptText(prompt.promptText);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (prompt: IndustryPrompt) => {
    setSelectedPrompt(prompt);
    setIsDeleteDialogOpen(true);
  };

  return (
    <AdminLayout title="Industry Prompts">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage industry-specific prompts for your AI system
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Industry Prompt
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Industry Prompts</CardTitle>
            <CardDescription>Create and manage specialized prompts for different industries</CardDescription>
          </CardHeader>
          <CardContent>
            {industryPromptsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-md border">
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : industryPromptsQuery.isError ? (
              <div className="bg-destructive/10 p-4 rounded-md border border-destructive flex items-center">
                <CircleAlert className="h-5 w-5 text-destructive mr-2" />
                <p>Error loading industry prompts: {String(industryPromptsQuery.error)}</p>
              </div>
            ) : !industryPromptsQuery.data || industryPromptsQuery.data.length === 0 ? (
              <div className="bg-muted p-4 rounded-md border text-center">
                <p className="text-muted-foreground">
                  No industry prompts have been defined yet. Click "Add Industry Prompt" to create one.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Industry</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {industryPromptsQuery.data.map((prompt) => (
                    <TableRow key={prompt.id}>
                      <TableCell className="font-medium">{prompt.industryName}</TableCell>
                      <TableCell className="truncate max-w-md">{prompt.promptText}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(prompt)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(prompt)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Industry Prompt Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Industry Prompt</DialogTitle>
            <DialogDescription>
              Create a new industry-specific prompt for your AI system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="industryName">Industry Name</Label>
              <Input
                id="industryName"
                placeholder="Enter industry name"
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promptText">Prompt</Label>
              <Textarea
                id="promptText"
                placeholder="Enter industry-specific prompt"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPrompt}
              disabled={createPromptMutation.isPending}
            >
              {createPromptMutation.isPending ? "Saving..." : "Save Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Industry Prompt Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Industry Prompt</DialogTitle>
            <DialogDescription>
              Update this industry-specific prompt.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editIndustryName">Industry Name</Label>
              <Input
                id="editIndustryName"
                placeholder="Enter industry name"
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editPromptText">Prompt</Label>
              <Textarea
                id="editPromptText"
                placeholder="Enter industry-specific prompt"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditPrompt}
              disabled={updatePromptMutation.isPending}
            >
              {updatePromptMutation.isPending ? "Updating..." : "Update Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsDeleteDialogOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this industry prompt? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePrompt}
              disabled={deletePromptMutation.isPending}
            >
              {deletePromptMutation.isPending ? "Deleting..." : "Delete Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
