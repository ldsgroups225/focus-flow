import { databases, DATABASE_ID, PROJECTS_TABLE_ID } from './config';
import type { Project } from '@/lib/types';
import { ID, Models, Query } from 'appwrite';

const mapProjectFromAppwrite = (row: Models.Row): Project => {
  const rowData = row as unknown as Omit<Project, 'id'> & { $id: string };
  const { $id: rowId, ...rest } = rowData;

  return {
    id: rowId,
    ...rest,
  };
};

export const getProjects = (
  userId: string,
  callback: (projects: Project[]) => void
) => {
  const fetchProjects = async () => {
    try {
      const { rows } = await databases.listRows({
        databaseId: DATABASE_ID,
        tableId: PROJECTS_TABLE_ID,
        queries: [
          Query.equal("userId", userId),
        ],
      });

      const projects = rows.map(row =>
        mapProjectFromAppwrite(row)
      );
      callback(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      callback([]);
    }
  };

  fetchProjects();
};

export const addProject = async (userId: string, projectData: Omit<Project, 'id'>) => {
  try {
    const newProject = {
      ...projectData,
      userId,
    };

    const response = await databases.createRow({
      databaseId: DATABASE_ID,
      tableId: PROJECTS_TABLE_ID,
      rowId: ID.unique(),
      data: newProject,
    });

    return response;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

export const updateProject = async (userId: string, projectId: string, projectData: Partial<Project>) => {
  try {
    const updatedData = { ...projectData };
    delete updatedData.id;

    const response = await databases.updateRow({
      databaseId: DATABASE_ID,
      tableId: PROJECTS_TABLE_ID,
      rowId: projectId,
      data: updatedData,
    });

    return response;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (userId: string, projectId: string) => {
  try {
    await databases.deleteRow({
      databaseId: DATABASE_ID,
      tableId: PROJECTS_TABLE_ID,
      rowId: projectId,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
