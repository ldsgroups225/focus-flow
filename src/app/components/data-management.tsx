'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useI18n } from './i18n-provider';
import type { Task } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DataManagementProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

export function DataManagement({ tasks, setTasks }: DataManagementProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importedTasks, setImportedTasks] = useState<Task[]>([]);

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        const parsedTasks = JSON.parse(content as string);
        // Basic validation
        if (Array.isArray(parsedTasks)) {
            // Revive dates
             const tasksWithDates = parsedTasks.map((task: any) => ({
                ...task,
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
            }));
          setImportedTasks(tasksWithDates);
          setShowImportConfirm(true);
        } else {
          alert(t('data.importError'));
        }
      } catch (error) {
        alert(t('data.importError'));
      }
    };
    reader.readAsText(file);
    // Reset file input
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const confirmImport = () => {
    setTasks(importedTasks);
    setShowImportConfirm(false);
    setImportedTasks([]);
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        {t('data.export')}
      </Button>
      <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        {t('data.import')}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/json"
        className="hidden"
      />
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('data.confirmImportTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('data.confirmImportDesc', { count: importedTasks.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportedTasks([])}>{t('taskForm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>{t('data.confirmImport')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
