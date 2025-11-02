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
import { useERPStore } from "./lib/data-store";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const { currentModule, setCurrentModule } = useERPStore();
  const [currentSubModule, setCurrentSubModule] =
    useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const handleModuleChange = (
    module: string,
    subModule?: string,
  ) => {
    setCurrentModule(module);
    setCurrentSubModule(subModule || "");
  };

  const handleSidebarCollapseChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  const renderContent = () => {
    switch (currentModule) {
      case "dashboard":
        return <Dashboard onNavigate={handleModuleChange} />;
      case "master-data":
        return (
          <MasterDataManagement
            currentSubModule={currentSubModule}
          />
        );
      case "rd-management":
        return (
          <RDManagement currentSubModule={currentSubModule} />
        );
      case "production":
        return (
          <ProductionManagement
            currentSubModule={currentSubModule}
          />
        );
      case "inventory":
        return (
          <InventoryManagement
            currentSubModule={currentSubModule}
          />
        );
      case "delivery":
        return (
          <DeliveryManagement
            currentSubModule={currentSubModule}
          />
        );
      case "users":
        return <UserManagement />;
      case "notifications":
        return <NotificationsAlerts />;
      case "reports":
        return (
          <ReportsAnalytics
            currentSubModule={currentSubModule}
          />
        );
      case "wireframe":
        return <SystemWireframe />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <FigmaSidebar
        currentModule={currentModule}
        currentSubModule={currentSubModule}
        onModuleChange={handleModuleChange}
        onCollapseChange={handleSidebarCollapseChange}
      />
      <main
        className={`h-screen transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-80"} scrollbar-hide overflow-hidden`}
      >
        {/* Header Bar */}
        <HeaderBar currentModule={currentModule} />

        {/* Main Content */}
        <div className="h-[calc(100vh-80px)] p-6 scrollbar-hide overflow-y-auto overflow-x-hidden">
          <div className="max-w-full mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}