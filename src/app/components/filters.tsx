'use client';

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
import type { Priority } from "@/lib/types";
import { useI18n } from "./i18n-provider";

type FiltersProps = {
  priorityFilter: Priority[];
  setPriorityFilter: (priorities: Priority[]) => void;
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  uniqueTags: string[];
};

export function Filters({ priorityFilter, setPriorityFilter, tagFilter, setTagFilter, uniqueTags }: FiltersProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">{t('filters.byPriority')}</h3>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={priorityFilter}
          onValueChange={(value: Priority[]) => setPriorityFilter(value)}
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="low" aria-label="Toggle low priority">{t('filters.low')}</ToggleGroupItem>
          <ToggleGroupItem value="medium" aria-label="Toggle medium priority">{t('filters.medium')}</ToggleGroupItem>
          <ToggleGroupItem value="high" aria-label="Toggle high priority">{t('filters.high')}</ToggleGroupItem>
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
    </div>
  );
}
