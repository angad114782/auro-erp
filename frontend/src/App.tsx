import React, { useState } from "react";
import { FigmaSidebar } from "./components/FigmaSidebar";
import { HeaderBar } from "./components/HeaderBar";
import { Dashboard } from "./components/Dashboard";
import { MasterDataManagement } from "./components/MasterDataManagement";
import { InventoryManagement } from "./components/InventoryManagement";
import { RDManagement } from "./components/RDManagement";
import { ProductionManagement } from "./components/ProductionManagement";
import { UserManagement } from "./components/UserManagement";
import { NotificationsAlerts } from "./components/NotificationsAlerts";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { SystemWireframe } from "./components/SystemWireframe";
import { DeliveryManagement } from "./components/DeliveryManagement";
import { LoginPage } from "./components/LoginPage";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { ERPProvider, useERP } from "./lib/stores/erpContext";
import { Menu } from "lucide-react";
import { Button } from "./components/ui/button";
import ProjectListCard from "./components/AllProjects";
import { ProductionTrackingTable } from "./components/ProductionTrackingTable";
import { ImagePreviewDialog } from "./components/ImagePreviewDialog";

// Main App Content (protected routes)
function AppContent(): React.JSX.Element {
  const {
    currentModule,
    currentSubModule,
    handleModuleChange,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useERP();
  const { hasPermission } = useAuth();

  const { user } = useAuth();

  // State for mobile sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSidebarCollapseChange = (collapsed: boolean): void => {
    setSidebarCollapsed(collapsed);
  };

  const toggleMobileSidebar = (): void => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const renderContent = (): React.JSX.Element => {
    // Check if user has permission to access the module

    // 👇 SUPERVISOR: FORCE TRACKING ONLY
    if (user?.role === "Supervisor") {
      return <ProductionTrackingTable />;
    }

    // 👇 STORE: FORCE INVENTORY MODULE ONLY
    if (user?.role === "Store") {
      return <InventoryManagement currentSubModule={currentSubModule} />;
    }

    if (!hasPermission(currentModule)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-9V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v2m4 6h4a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6a2 2 0 012-2h4z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              You don't have permission to access this module.
            </p>
          </div>
        </div>
      );
    }

    switch (currentModule) {
      // case "dashboard":
      //   return <Dashboard onNavigate={handleModuleChange} />;
      case "all-projects":
        return <ProjectListCard />;

      // case "master-data":
      //   return <MasterDataManagement currentSubModule={currentSubModule} />;
      case "rd-management":
        return <RDManagement />;
      case "production":
        return <ProductionManagement />;
      case "inventory":
        return <InventoryManagement currentSubModule={currentSubModule} />;
      case "delivery":
        return <DeliveryManagement currentSubModule={currentSubModule} />;
      case "users":
        return <UserManagement />;
      case "notifications":
        return <NotificationsAlerts />;
      case "reports":
        return <ReportsAnalytics currentSubModule={currentSubModule} />;
      case "wireframe":
        return <SystemWireframe />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen bg-linear-to-br from-gray-50 to-gray-100 overflow-hidden">
      <FigmaSidebar
        currentModule={currentModule}
        currentSubModule={currentSubModule}
        onModuleChange={handleModuleChange}
        onCollapseChange={handleSidebarCollapseChange}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={toggleMobileSidebar}
      />

      {/* Mobile Sidebar Toggle Button - Adjusted for compact header */}
      <div
        className={`md:hidden fixed z-50 transition-all duration-300 ${
          isMobileSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          top: "1rem", // 3rem (py-3 * 2) + 12px margin
          left: "1rem",
        }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobileSidebar}
          className="bg-white shadow-md"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      <main
        className={`h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-80"
        } ml-0 scrollbar-hide overflow-hidden relative`}
      >
        {/* Mobile overlay when sidebar is open - placed in main content */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMobileSidebar}
          />
        )}

        {/* Header Bar - Now more compact */}
        <HeaderBar currentModule={currentModule} />

        {/* Main Content - Adjusted height for compact header */}
        <div className="h-[calc(100vh-64px)] p-3 md:p-6 scrollbar-hide overflow-y-auto overflow-x-hidden relative z-10">
          <div className="max-w-full mx-auto">{renderContent()}</div>
        </div>
      </main>
      <Toaster position="bottom-left" closeButton />
    </div>
  );
}

// Root App Component
function App(): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <AppContent /> : <LoginPage />;
}

// App with Providers
export default function AppWithProviders(): React.JSX.Element {
  return (
    <AuthProvider>
      <ERPProvider>
        <ImagePreviewDialog />
        <App />
      </ERPProvider>
    </AuthProvider>
  );
}
