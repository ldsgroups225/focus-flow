'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Network } from 'lucide-react';
import { useI18n } from './i18n-provider';

type AiFeatureSelectorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectReview: () => void;
  onSelectDependency: () => void;
};

export function AiFeatureSelector({
  isOpen,
  onClose,
  onSelectReview,
  onSelectDependency
}: AiFeatureSelectorProps) {
  const { t } = useI18n();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('aiFeatures.title')}
          </DialogTitle>
          <DialogDescription>
            {t('aiFeatures.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 hover:bg-accent whitespace-normal"
            onClick={() => {
              onClose();
              onSelectReview();
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <span className="font-semibold text-left">{t('aiFeatures.reviewGeneration')}</span>
            </div>
            <p className="text-sm text-muted-foreground text-left w-full wrap-break-word">
              {t('aiFeatures.reviewDescription')}
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 hover:bg-accent whitespace-normal"
            onClick={() => {
              onClose();
              onSelectDependency();
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <Network className="h-5 w-5 shrink-0 text-primary" />
              <span className="font-semibold text-left">{t('aiFeatures.dependencyRefinement')}</span>
            </div>
            <p className="text-sm text-muted-foreground text-left w-full wrap-break-word">
              {t('aiFeatures.dependencyDescription')}
            </p>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
