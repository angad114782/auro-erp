import React from "react";
import { useERP } from "../lib/stores/erpContext";

// Import sub-modules
import { RDDashboard } from "./RDDashboard";
import ProjectDevelopment from "./ProjectDevelopment";
import { RedSeal } from "./RedSeal";
import { GreenSeal } from "./GreenSeal";
import { POTargetDate } from "./POTargetDate";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function RDManagement() {
  const { currentSubModule, handleModuleChange } = useERP();
  const [newProjectOpen, setNewProjectOpen] = React.useState(false);
  console.log("📌 RDManagement received submodule:", currentSubModule);

  const handleCloseDialog = React.useCallback(() => {
    setNewProjectOpen(false);
  }, []);

  // Render specific module based on global sub-module
  switch (currentSubModule) {
    case "rd-dashboard":
      return (
        <RDDashboard
          onNavigate={(m) => handleModuleChange("rd-management", m)}
        />
      );

    case "project":
      return <ProjectDevelopment />;

    case "red-seal":
      return <RedSeal />;

    case "green-seal":
      return <GreenSeal />;

    case "po-target-date":
      return <POTargetDate />;

    // DEFAULT: RD Dashboard
    default:
      return (
        <div className="space-y-6">
          <RDDashboard
            onNavigate={(m) => handleModuleChange("rd-management", m)}
          />

          <CreateProjectDialog
            open={newProjectOpen}
            onClose={handleCloseDialog}
          />
        </div>
      );
  }
}
