// hooks/useProjects.ts
import { useState, useCallback } from "react";
import { projectService } from "../components/services/projectService";
import type { Project } from "../components/services/projectService";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const projectList = await projectService.getProjects();
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (formData: FormData) => {
    try {
      const newProject = await projectService.createProject(formData);
      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error("Create project failed", error);
      throw error;
    }
  }, []);

  const updateProject = useCallback(
    async (projectId: string, formData: FormData) => {
      try {
        const updatedProject = await projectService.updateProject(
          projectId,
          formData
        );
        setProjects((prev) =>
          prev.map((p) => (p._id === projectId ? updatedProject : p))
        );
        return updatedProject;
      } catch (error) {
        console.error("Update project failed", error);
        throw error;
      }
    },
    []
  );

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (error) {
      console.error("Delete project failed", error);
      throw error;
    }
  }, []);

  // NEW: updateProjectStatus (uses universal route)
  const updateProjectStatus = useCallback(
    async (projectId: string, status: string) => {
      try {
        const updated = await projectService.updateProjectStatus(
          projectId,
          status
        );
        // service returns updated project (assumption). If not, you may want to refetch.
        if (updated && updated._id) {
          setProjects((prev) =>
            prev.map((p) => (p._id === updated._id ? updated : p))
          );
        } else {
          // if backend returns minimal response, refresh list
          await loadProjects();
        }
        return updated;
      } catch (error) {
        console.error("Update project status failed", error);
        throw error;
      }
    },
    [loadProjects]
  );

  // Sequences (reserve/cancel) — thin wrappers to service
  const reserveSequence = useCallback(async () => {
    try {
      const seq = await projectService.reserveSequence();
      return seq;
    } catch (error) {
      console.error("Reserve sequence failed", error);
      throw error;
    }
  }, []);

  const cancelSequence = useCallback(async (sequenceId: string) => {
    try {
      await projectService.cancelSequence(sequenceId);
    } catch (error) {
      console.error("Cancel sequence failed", error);
      throw error;
    }
  }, []);

  return {
    projects,
    loading,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    reserveSequence,
    cancelSequence,
  };
};
