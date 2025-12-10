'use client';

import { Filters } from '@/app/components/filters';
import { Card, CardContent } from '@/components/ui/card';
import type { Project, Priority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useI18n } from './i18n-provider';
import { FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarContentProps {
  priorityFilter: Priority[];
  setPriorityFilter: (priorities: Priority[]) => void;
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  uniqueTags: string[];
  projects: Project[];
  setProjectFilter: (selectedProjectId: string | undefined) => void;
  className?: string; // Added optional className
}

export function SidebarContent({
  priorityFilter,
  setPriorityFilter,
  tagFilter,
  setTagFilter,
  uniqueTags,
  projects,
  setProjectFilter,
  className,
}: SidebarContentProps) {
  const { t } = useI18n();

  return (
    <div className={cn("sticky top-24 space-y-8", className)}>
      <div className="space-y-3">
        <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase px-1">{t('header.filters')}</h2>
        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-xl">
          <CardContent className="p-3">
            <Filters
              projectFilter={projects}
              setProjectFilter={setProjectFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              uniqueTags={uniqueTags}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">{t('projects.title')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProjectFilter(undefined)}
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            {t('taskForm.clear')}
          </Button>
        </div>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="p-2 space-y-0.5 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {projects.length === 0 ? (
              <div className="text-center py-6 px-4 text-muted-foreground text-xs">
                <FolderOpen className="w-8 h-8 opacity-20 mx-auto mb-2" />
                <p>No projects yet</p>
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setProjectFilter(project.id)}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent/80 hover:text-accent-foreground text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all" />
                    <span className="font-medium truncate text-sm">{project.name}</span>
                  </div>
                  {/* <FolderOpen className="w-3.5 h-3.5 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" /> */}
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border/50 bg-muted/20">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground h-8" asChild>
              <Link href="/projects">
                <Settings className="mr-2 size-3.5" />
                {t('projects.manage')}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
