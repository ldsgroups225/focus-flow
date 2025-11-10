import type { Task } from '@/lib/types';
import { TaskServerService } from '@/lib/server/task-server';

/**
 * Server Component: Task Statistics
 * Pure presentational component that runs on the server
 */
interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const stats = TaskServerService.getTaskStats(tasks);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-card p-4 rounded-lg border">
        <div className="text-sm text-muted-foreground">Total Tasks</div>
        <div className="text-2xl font-bold">{stats.total}</div>
      </div>
      <div className="bg-card p-4 rounded-lg border">
        <div className="text-sm text-muted-foreground">In Progress</div>
        <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
      </div>
      <div className="bg-card p-4 rounded-lg border">
        <div className="text-sm text-muted-foreground">Completed</div>
        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
      </div>
      <div className="bg-card p-4 rounded-lg border">
        <div className="text-sm text-muted-foreground">Completion Rate</div>
        <div className="text-2xl font-bold text-blue-600">{stats.completionRate}%</div>
      </div>
    </div>
  );
}
