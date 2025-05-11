import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
}

// Create a form schema based on the insert schema, but remove some fields that are handled automatically
const formSchema = insertUserSchema.omit({
  googleId: true,
  avatarUrl: true,
  companyId: true,
}).extend({
  // Add a password field for new users
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

// When editing, make fields optional
const editFormSchema = formSchema.partial();

type FormValues = z.infer<typeof formSchema>;

export function UserForm({ user, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const isEditing = !!user;
  
  // Use the appropriate schema based on whether we're editing or creating
  const schema = isEditing ? editFormSchema : formSchema;
  
  // Default values for the form
  const defaultValues: Partial<FormValues> = user
    ? {
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      }
    : {
        username: "",
        email: "",
        name: "",
        role: "member",
        isActive: true,
      };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  
  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing) {
        // Update existing user
        await apiRequest("PUT", `/api/users/${user.id}`, data);
        
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        await apiRequest("POST", "/api/users", {
          ...data,
          googleId: `manual_${Date.now()}`, // Temporary ID for manually created users
        });
        
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting user:", error);
      
      toast({
        title: "Error",
        description: "Failed to save user",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {!isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="grid grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="member">Team Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="submit">{isEditing ? "Update User" : "Create User"}</Button>
        </div>
      </form>
    </Form>
  );
}
