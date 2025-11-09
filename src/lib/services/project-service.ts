import type { Project } from '@/lib/types';
import { addProject, deleteProject, getProjects, updateProject } from '@/lib/appwrite/project-services';

/**
 * Project Service - Handles all project-related business logic
 * Separates business logic from state management and UI
 */
export class ProjectService {
  /**
   * Fetch all projects for a user
   */
  static async fetchProjects(
    userId: string,
    callback: (projects: Project[]) => void
  ): Promise<void> {
    try {
      getProjects(userId, callback);
    } catch (error) {
      console.error('Error fetching projects:', error);
      callback([]);
    }
  }

  /**
   * Create a new project
   */
  static async createProject(
    userId: string,
    projectData: Omit<Project, 'id'>
  ): Promise<void> {
    try {
      await addProject(userId, projectData);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Update an existing project
   */
  static async updateProjectData(
    userId: string,
    projectId: string,
    updates: Partial<Project>
  ): Promise<void> {
    try {
      await updateProject(userId, projectId, updates);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   */
  static async deleteProjectData(
    userId: string,
    projectId: string
  ): Promise<void> {
    try {
      await deleteProject(userId, projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
}
