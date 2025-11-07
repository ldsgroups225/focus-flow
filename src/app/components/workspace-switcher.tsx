'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, User, Briefcase, Code } from 'lucide-react';
import type { Workspace } from "@/lib/types";
import { useI18n } from "./i18n-provider";
import React from "react";

type WorkspaceSwitcherProps = {
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
};

const workspaceDetails: Record<Workspace, { icon: React.ReactNode; key: string }> = {
  personal: { icon: <User className="mr-2 h-4 w-4" />, key: "personal" },
  work: { icon: <Briefcase className="mr-2 h-4 w-4" />, key: "work" },
  "side-project": { icon: <Code className="mr-2 h-4 w-4" />, key: "sideProject" },
};

export function WorkspaceSwitcher({ activeWorkspace, setActiveWorkspace }: WorkspaceSwitcherProps) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-lg font-bold gap-2 pl-2 pr-3">
          {workspaceDetails[activeWorkspace].icon}
          {t(`workspace.${workspaceDetails[activeWorkspace].key}`)}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {Object.keys(workspaceDetails).map((ws) => (
          <DropdownMenuItem
            key={ws}
            onClick={() => setActiveWorkspace(ws as Workspace)}
            disabled={activeWorkspace === ws}
          >
            {workspaceDetails[ws as Workspace].icon}
            {t(`workspace.${workspaceDetails[ws as Workspace].key}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
