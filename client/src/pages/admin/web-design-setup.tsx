import { CreateWebDesignIndustry } from "@/components/admin/create-web-design-industry";
import { isAdmin } from "@/lib/auth";

export default function WebDesignSetupPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Web Design Industry Setup</h2>
        <p className="text-muted-foreground">
          Create a Web Design industry and connect it to all client accounts
        </p>
      </div>
      
      <CreateWebDesignIndustry />
    </div>
  );
}

// Ensure only admins can access this page
WebDesignSetupPage.requireAuth = true;
WebDesignSetupPage.requireAdmin = true;