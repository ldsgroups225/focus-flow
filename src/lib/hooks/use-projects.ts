import { useState, useCallback } from 'react';
import type { Project } from '@/lib/types';
import { ProjectService } from '@/lib/services/project-service';

export const useProjects = (userId: string | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(() => {
    if (!userId) return;
    setIsLoading(true);
    ProjectService.fetchProjects(userId, (fetchedProjects) => {
      setProjects(fetchedProjects);
      setIsLoading(false);
    });
  }, [userId]);

  const saveProject = async (projectData: Omit<Project, 'id'>) => {
    if (!userId) return;
    await ProjectService.createProject(userId, projectData);
    fetchProjects();
  };

  const deleteProject = async (projectId: string) => {
    if (!userId) return;
    await ProjectService.deleteProjectData(userId, projectId);
    fetchProjects();
  };

  const updateProject = async (projectId: string, projectData: Partial<Project>) => {
    if (!userId) return;
    await ProjectService.updateProjectData(userId, projectId, projectData);
    fetchProjects();
  };

  return { projects, isLoading, saveProject, deleteProject, fetchProjects, updateProject };
};
