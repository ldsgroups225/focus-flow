export type Priority = "low" | "medium" | "high";
export type Workspace = "personal" | "work" | "side-project";

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  tags: string[];
  dueDate?: Date;
  pomodoros: number;
  completedPomodoros: number;
  timeSpent: number; // in seconds
  dependsOn?: string[];
  workspace: Workspace;
}
