/**
 * Main Application Component
 * Emergency implementation to address blank screen issues
 */
import React from "react";
import { Route, Switch, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth-context";
// import { AdminAuthProvider } from "@/lib/admin-auth-context"; // Removed
import { ThemeProvider } from "@/lib/theme-context";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { IosPwaInstaller } from "@/components/ui/ios-pwa-installer";
import { MobileNav } from "@/components/ui/mobile-nav";
import { AdminBanner } from "@/components/ui/admin-banner";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
// import { AdminRoute } from "@/lib/admin-route"; // Replaced with DirectAdminRoute logic

// Import pages
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import QuotesPage from "@/pages/quotes";
import NewQuotePage from "@/pages/new-quote";
import EditQuotePage from "@/pages/edit-quote";
import QuoteAiChat from "@/pages/quote-ai-chat";
import TrainingPage from "@/pages/training";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import AdminDashboard from "@/pages/admin/index";
// import AdminLogin from "@/pages/admin-login"; // Removed
import ResetPasswordPage from "@/pages/reset-password-page";
import AdminUsers from "@/pages/admin/users";
import SystemPrompts from "@/pages/admin/system-prompts";
import MasterPromptPage from "@/pages/admin/master-prompt";
import AdminSettings from "@/pages/admin/settings";
// import IndustriesPage from "@/pages/admin/industries"; // Removed
import IndustryPromptsPage from "@/pages/admin/industry-prompts";
import WebDesignSetupPage from "@/pages/admin/web-design-setup";

// Import route components
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
function DirectRoute({ path, component: Component, title }: { path: string, component: React.ComponentType, title: string }) {
  const { user, isLoading } = useAuth();

  // Make a component to wrap the route content
  const RouteContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return <Redirect to="/auth" />;
    }

    return (
      <DashboardLayout title={title}>
        <Component />
      </DashboardLayout>
    );
  };

  return <Route path={path} component={RouteContent} />;
}

// Admin route direct implementation
function DirectAdminRoute({ path, component: Component, title }: { path: string, component: React.ComponentType, title: string }) {
  const { user, isLoading } = useAuth();

  // Make a component to wrap the route content
  const AdminRouteContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user || user.role !== 'admin') {
      return <Redirect to="/quotes" />;
    }

    return (
      <AdminLayout title={title}>
        <Component />
      </AdminLayout>
    );
  };

  return <Route path={path} component={AdminRouteContent} />;
}

// Regular app content
function RegularAppContent() {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <DirectRoute path="/dashboard" component={Dashboard} title="Dashboard" />
        <DirectRoute path="/quotes" component={QuotesPage} title="Quotes" />
        <DirectRoute path="/new-quote" component={NewQuotePage} title="New Quote" />
        <DirectRoute path="/edit-quote/:id" component={EditQuotePage} title="Edit Quote" />
        <DirectRoute path="/quotes/:id/ai-chat" component={QuoteAiChat} title="AI Chat" />
        <DirectRoute path="/training" component={TrainingPage} title="Training" />
        <DirectRoute path="/users" component={UsersPage} title="Users" />
        <DirectRoute path="/settings" component={SettingsPage} title="Settings" />
        <Route path="/">
          <Redirect to="/quotes" />
        </Route>
        <Route>
          <Redirect to="/quotes" />
        </Route>
      </Switch>

      {user && (
        <>
          <MobileNav userRole={userRole} />
        </>
      )}

      <IosPwaInstaller />
      <Toaster />
    </>
  );
}

// Admin app content
function AdminAppContent() {
  return (
    <>
      <Switch>
        <DirectAdminRoute path="/admin" component={AdminDashboard} title="Admin Dashboard" />
        <DirectAdminRoute path="/admin/users" component={AdminUsers} title="Admin Users" />
        <DirectAdminRoute path="/admin/system-prompts" component={SystemPrompts} title="System Prompts" />
        <DirectAdminRoute path="/admin/master-prompt" component={MasterPromptPage} title="Master Prompt" />
        <DirectAdminRoute path="/admin/settings" component={AdminSettings} title="Admin Settings" />
        <DirectAdminRoute path="/admin/industry-prompts" component={IndustryPromptsPage} title="Industry Prompts" />
        <DirectAdminRoute path="/admin/web-design-setup" component={WebDesignSetupPage} title="Web Design Setup" />
        <Route path="/admin/*">
          <Redirect to="/admin" />
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}

// App with simplified structure
function AppContent() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');

  // Render either admin or regular app content based on route
  return isAdminRoute ? <AdminAppContent /> : <RegularAppContent />;
}

// Main app with auth provider and theme provider
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;