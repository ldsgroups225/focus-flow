import { Orbit } from 'lucide-react';
import { WorkspaceService } from '@/lib/services/workspace-service';
import type { Workspace } from '@/lib/types';

/**
 * Server Component: Workspace Header
 * Pure presentational component for the dashboard header
 */
interface WorkspaceHeaderProps {
  workspace: Workspace;
  taskCount: number;
}

export function WorkspaceHeader({ workspace, taskCount }: WorkspaceHeaderProps) {
  const label = WorkspaceService.getWorkspaceLabel(workspace);
  const { color } = WorkspaceService.getWorkspaceConfig(workspace);

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${color} text-white`}>
        <Orbit className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">{label}</h1>
        <p className="text-muted-foreground">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'} in this workspace
        </p>
      </div>
    </div>
  );
}
