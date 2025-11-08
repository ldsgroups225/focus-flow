import type { Workspace } from '@/lib/types';

const WORKSPACE_CONFIG = {
  personal: {
    label: 'Personal',
    color: 'bg-blue-500',
    icon: '👤',
  },
  work: {
    label: 'Work',
    color: 'bg-green-500',
    icon: '💼',
  },
  'side-project': {
    label: 'Side Project',
    color: 'bg-purple-500',
    icon: '🚀',
  },
} as const;

/**
 * Workspace Service - Handles workspace-related business logic
 */
export class WorkspaceService {
  /**
   * Get all available workspaces
   */
  static getWorkspaces(): Array<{
    value: Workspace;
    label: string;
    icon: string;
  }> {
    return [
      {
        value: 'personal',
        label: WORKSPACE_CONFIG.personal.label,
        icon: WORKSPACE_CONFIG.personal.icon,
      },
      {
        value: 'work',
        label: WORKSPACE_CONFIG.work.label,
        icon: WORKSPACE_CONFIG.work.icon,
      },
      {
        value: 'side-project',
        label: WORKSPACE_CONFIG['side-project'].label,
        icon: WORKSPACE_CONFIG['side-project'].icon,
      },
    ];
  }

  /**
   * Get workspace configuration
   */
  static getWorkspaceConfig(workspace: Workspace) {
    return WORKSPACE_CONFIG[workspace];
  }

  /**
   * Get workspace display name
   */
  static getWorkspaceLabel(workspace: Workspace): string {
    return this.getWorkspaceConfig(workspace).label;
  }

  /**
   * Validate workspace value
   */
  static isValidWorkspace(value: string): value is Workspace {
    return value === 'personal' || value === 'work' || value === 'side-project';
  }

  /**
   * Get next workspace in cycle
   */
  static getNextWorkspace(current: Workspace): Workspace {
    const order: Workspace[] = ['personal', 'work', 'side-project'];
    const currentIndex = order.indexOf(current);
    const nextIndex = (currentIndex + 1) % order.length;
    return order[nextIndex];
  }

  /**
   * Get workspace color class
   */
  static getWorkspaceColor(workspace: Workspace): string {
    return this.getWorkspaceConfig(workspace).color;
  }
}
