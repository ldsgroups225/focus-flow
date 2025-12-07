'use client';

import { useState, useCallback } from 'react';
import { Template, TemplateService } from '@/lib/services/template-service';

export function useTemplates(userId: string | null) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(() => {
    if (!userId) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }
    const userTemplates = TemplateService.getAll(userId);
    setTemplates(userTemplates);
    setIsLoading(false);
  }, [userId]);

  const saveTemplate = useCallback(
    (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!userId) return;
      TemplateService.save(templateData);
      fetchTemplates();
    },
    [userId, fetchTemplates]
  );

  const updateTemplate = useCallback(
    (templateId: string, updates: Partial<Omit<Template, 'id' | 'userId' | 'createdAt'>>) => {
      if (!userId) return;
      TemplateService.update(templateId, userId, updates);
      fetchTemplates();
    },
    [userId, fetchTemplates]
  );

  const deleteTemplate = useCallback(
    (templateId: string) => {
      if (!userId) return;
      TemplateService.delete(templateId, userId);
      fetchTemplates();
    },
    [userId, fetchTemplates]
  );

  return {
    templates,
    isLoadingTemplates: isLoading,
    fetchTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
