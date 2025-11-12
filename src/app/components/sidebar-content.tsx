'use client';

import { Filters } from '@/app/components/filters';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Project, Priority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useI18n } from './i18n-provider';

interface SidebarContentProps {
  priorityFilter: Priority[];
  setPriorityFilter: (priorities: Priority[]) => void;
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  uniqueTags: string[];
  projects: Project[];
  setProjectFilter: (selectedProjectId: string | undefined) => void;
}

export function SidebarContent({
  priorityFilter,
  setPriorityFilter,
  tagFilter,
  setTagFilter,
  uniqueTags,
  projects,
  setProjectFilter,
}: SidebarContentProps) {
  const { t } = useI18n();
  return (
    <div className="sticky top-8 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('header.filters')}</h2>
        <Filters
          projectFilter={projects}
          setProjectFilter={setProjectFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          uniqueTags={uniqueTags}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('projects.title')}</h2>
          <Button variant="ghost" size="sm" onClick={() => setProjectFilter(undefined)}>
            {t('taskForm.clear')}
          </Button>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {projects.map((project) => (
            <AccordionItem value={project.id} key={project.id}>
              <AccordionTrigger onClick={() => setProjectFilter(project.id)}>{project.name}</AccordionTrigger>
              <AccordionContent>
                {project.description}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
          <Link href="/projects">{t('projects.title')}</Link>
        </Button>
      </div>
    </div>
  );
}
