
'use client';

import { memo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import type { Priority, Project } from "@/lib/types";
import { useI18n } from "./i18n-provider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';

type FiltersProps = {
  projectFilter: Project[];
  setProjectFilter: (selectedProjectId: string | undefined) => void;
  priorityFilter: Priority[];
  setPriorityFilter: (priorities: Priority[]) => void;
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  uniqueTags: string[];
};

const Filters = memo(function Filters({ projectFilter, setProjectFilter, priorityFilter, setPriorityFilter, tagFilter, setTagFilter, uniqueTags }: FiltersProps) {
  const { t } = useI18n();

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">{t('filters.byPriority')}</h3>
        <ToggleGroup
          size="xs"
          type="multiple"
          variant="outline"
          value={priorityFilter}
          onValueChange={(value: Priority[]) => setPriorityFilter(value)}
          className="flex flex-wrap justify-start gap-2"
        >
          <ToggleGroupItem value="low" aria-label="Toggle low priority" className="rounded-full">{t('filters.low')}</ToggleGroupItem>
          <ToggleGroupItem value="medium" aria-label="Toggle medium priority" className="rounded-full">{t('filters.medium')}</ToggleGroupItem>
          <ToggleGroupItem value="high" aria-label="Toggle high priority" className="rounded-full">{t('filters.high')}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">{t('filters.byTag')}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              {tagFilter.length > 0 ? `${tagFilter.length} ${t('filters.selected')}` : t('filters.selectTags')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>{t('filters.byTag')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueTags.map(tag => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={tagFilter.includes(tag)}
                onCheckedChange={(checked) => {
                  setTagFilter(
                    checked ? [...tagFilter, tag] : tagFilter.filter(t => t !== tag)
                  );
                }}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
             {tagFilter.length > 0 && (
                <>
                <DropdownMenuSeparator />
                <Button variant="ghost" className="w-full text-sm" onClick={() => setTagFilter([])}>{t('filters.clearFilters')}</Button>
                </>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">{t('filters.byProject')}</h3>
        <Select value={selectedProjectId} onValueChange={(value) => {
          setSelectedProjectId(value);
          setProjectFilter(value);
        }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('filters.selectProject')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {projectFilter.map(project => (
                <SelectItem
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </SelectItem>
              ))}
            </SelectGroup>
            {selectedProjectId && (
              <>
                <SelectSeparator />
                <Button 
                  variant="ghost" 
                  className="w-full text-sm" 
                  onClick={() => {
                    setSelectedProjectId(undefined);
                    setProjectFilter(undefined);
                  }}
                >
                  {t('filters.clearFilters')}
                </Button>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

Filters.displayName = 'Filters';

export { Filters };
