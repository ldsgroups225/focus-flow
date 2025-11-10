import { databases, DATABASE_ID, SUBTASKS_TABLE_ID } from './config';
import type { SubTask } from '@/lib/types';
import { ID, Models, Query } from 'appwrite';


const mapSubTaskFromAppwrite = (row: Models.Row): SubTask => {
  const rowData = row as unknown as SubTask & { $id: string };
  const { $id: rowId, ...rest } = rowData;

  return {
    ...rest,
    id: rowId,
  };
};

export const getSubTasksByTaskId = async (taskId: string): Promise<SubTask[]> => {
  try {
    const { rows } = await databases.listRows({
      databaseId: DATABASE_ID,
      tableId: SUBTASKS_TABLE_ID,
      queries: [
        Query.equal("taskId", taskId),
        Query.orderAsc("order"),
      ],
    });

    return rows.map(row => mapSubTaskFromAppwrite(row));
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return [];
  }
};

export const addSubTask = async (subTaskData: Omit<SubTask, 'id'>) => {
  try {
    const response = await databases.createRow({
      databaseId: DATABASE_ID,
      tableId: SUBTASKS_TABLE_ID,
      rowId: ID.unique(),
      data: subTaskData,
    });

    return mapSubTaskFromAppwrite(response);
  } catch (error) {
    console.error('Error adding subtask:', error);
    throw error;
  }
};

export const updateSubTask = async (subTaskId: string, subTaskData: Partial<SubTask>) => {
  try {
    const response = await databases.updateRow({
      databaseId: DATABASE_ID,
      tableId: SUBTASKS_TABLE_ID,
      rowId: subTaskId,
      data: subTaskData,
    });

    return mapSubTaskFromAppwrite(response);
  } catch (error) {
    console.error('Error updating subtask:', error);
    throw error;
  }
};

export const deleteSubTask = async (subTaskId: string) => {
  try {
    await databases.deleteRow({
      databaseId: DATABASE_ID,
      tableId: SUBTASKS_TABLE_ID,
      rowId: subTaskId,
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    throw error;
  }
};

export const deleteSubTasksByTaskId = async (taskId: string) => {
  try {
    const subtasks = await getSubTasksByTaskId(taskId);
    await Promise.all(subtasks.map(st => deleteSubTask(st.id)));
  } catch (error) {
    console.error('Error deleting subtasks for task:', error);
    throw error;
  }
};

export const bulkUpdateSubTasks = async (subTasks: SubTask[]) => {
  try {
    await Promise.all(
      subTasks.map(st => updateSubTask(st.id, st))
    );
  } catch (error) {
    console.error('Error bulk updating subtasks:', error);
    throw error;
  }
};
