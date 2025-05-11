import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Delete, Edit, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Spinner from "@/components/ui/spinner";
import { Client } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const clientFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactFirstName: z.string().min(1, "First name is required"),
  contactLastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientsPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return await res.json();
    },
  });
  
  // Create client mutation
  const createMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Client created",
        description: "The client has been created successfully.",
      });
      setIsCreating(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create client",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClientFormValues }) => {
      const res = await apiRequest("PATCH", `/api/clients/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Client updated",
        description: "The client has been updated successfully.",
      });
      setIsEditing(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update client",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete client",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create client form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: "",
      contactFirstName: "",
      contactLastName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });
  
  // Edit client form
  const editForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: "",
      contactFirstName: "",
      contactLastName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });
  
  // Handle create client
  const onCreateSubmit = (data: ClientFormValues) => {
    createMutation.mutate(data);
  };
  
  // Handle edit client
  const onEditSubmit = (data: ClientFormValues) => {
    if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, data });
    }
  };
  
  // Handle edit client dialog open
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    editForm.reset({
      companyName: client.companyName,
      contactFirstName: client.contactFirstName || "",
      contactLastName: client.contactLastName || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setIsEditing(true);
  };
  
  // Handle delete client
  const handleDeleteClient = (id: number) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Filter clients by search term
  const filteredClients = clients.filter((client: Client) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${client.contactFirstName || ''} ${client.contactLastName || ''}`.trim().toLowerCase();
    
    return (
      client.companyName.toLowerCase().includes(searchLower) ||
      fullName.includes(searchLower) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.phone && client.phone.toLowerCase().includes(searchLower))
    );
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">Manage your clients and their information</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Enter the client details below. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
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
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Spinner className="mr-2" /> : null}
                      Save Client
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Client</DialogTitle>
                <DialogDescription>
                  Update the client details below. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="contactFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="contactLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Spinner className="mr-2" /> : null}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Clients list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : filteredClients.length > 0 ? (
            filteredClients.map((client: Client) => (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{client.companyName}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {client.contactFirstName} {client.contactLastName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <div className="font-medium w-24">Email:</div>
                    <div className="flex-1">{client.email}</div>
                  </div>
                  {client.phone && (
                    <div className="flex items-start">
                      <div className="font-medium w-24">Phone:</div>
                      <div className="flex-1">{client.phone}</div>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start">
                      <div className="font-medium w-24">Address:</div>
                      <div className="flex-1">{client.address}</div>
                    </div>
                  )}
                  {client.notes && (
                    <div className="flex items-start">
                      <div className="font-medium w-24">Notes:</div>
                      <div className="flex-1">{client.notes}</div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClient(client)}
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <Delete size={16} className="mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-10 text-center">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No clients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No clients match your search criteria"
                  : "You haven't added any clients yet"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus size={16} className="mr-2" />
                  Add Your First Client
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}