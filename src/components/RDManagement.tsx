import React, { useState } from 'react';
import { CreateProjectDialog } from './CreateProjectDialog';

// Import sub-components
import { RDDashboard } from './RDDashboard';
import { ProjectDevelopment } from './ProjectDevelopment';
import { RedSeal } from './RedSeal';
import { GreenSeal } from './GreenSeal';
import { POTargetDate } from './POTargetDate';

interface RDManagementProps {
  currentSubModule?: string;
}

export function RDManagement({ currentSubModule }: RDManagementProps) {
  const [selectedSubModule, setSelectedSubModule] = useState('');
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // Safe close handler for dialog
  const handleCloseDialog = React.useCallback(() => {
    console.log('RDManagement handleCloseDialog called');
    setNewProjectOpen(false);
  }, []);

  React.useEffect(() => {
    if (currentSubModule) {
      setSelectedSubModule(currentSubModule);
    }
  }, [currentSubModule]);

  // Route to specific components based on sub-module
  if (selectedSubModule === 'rd-dashboard') {
    return <RDDashboard onNavigate={setSelectedSubModule} />;
  }
  
  if (selectedSubModule === 'project') {
    return <ProjectDevelopment />;
  }
  
  if (selectedSubModule === 'red-seal') {
    return <RedSeal />;
  }
  
  if (selectedSubModule === 'green-seal') {
    return <GreenSeal />;
  }
  
  if (selectedSubModule === 'po-target-date') {
    return <POTargetDate />;
  }

  // Default view - show RDDashboard when no sub-module is selected
  return (
    <div className="space-y-6">
      <RDDashboard onNavigate={setSelectedSubModule} />
      
      {/* Create Project Dialog */}
      <CreateProjectDialog 
        open={newProjectOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}