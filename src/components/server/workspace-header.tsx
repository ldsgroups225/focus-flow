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
  const workspaceConfig = WorkspaceService.getWorkspaceConfig(workspace);
  const label = WorkspaceService.getWorkspaceLabel(workspace);

  return (
    <div className="flex items-center gap-4 mb-6">
      <Orbit className="w-7 h-7 md:w-8 md:h-8 text-primary" />
      <div>
        <h1 className="text-3xl font-bold">{label}</h1>
        <p className="text-muted-foreground">
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'} in this workspace
        </p>
      </div>
    </div>
  );
}
