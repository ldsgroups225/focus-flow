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

type FiltersProps = {
  priorityFilter: Priority[];
  setPriorityFilter: (priorities: Priority[]) => void;
  tagFilter: string[];
  setTagFilter: (tags: string[]) => void;
  uniqueTags: string[];
};

export function Filters({ priorityFilter, setPriorityFilter, tagFilter, setTagFilter, uniqueTags }: FiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">By Priority</h3>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={priorityFilter}
          onValueChange={(value: Priority[]) => setPriorityFilter(value)}
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="low" aria-label="Toggle low priority">Low</ToggleGroupItem>
          <ToggleGroupItem value="medium" aria-label="Toggle medium priority">Medium</ToggleGroupItem>
          <ToggleGroupItem value="high" aria-label="Toggle high priority">High</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">By Tag</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              {tagFilter.length > 0 ? `${tagFilter.length} selected` : "Select tags"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
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
                <Button variant="ghost" className="w-full text-sm" onClick={() => setTagFilter([])}>Clear filters</Button>
                </>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
