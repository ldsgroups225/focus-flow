'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, AlertTriangle, Lightbulb, CheckCircle2, Loader2, Calendar, Flag, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useI18n } from '@/app/components/i18n-provider';
import type { TaskWithSubTasks, Priority } from '@/lib/types';

type PlannedTask = {
  taskId: string;
  suggestedOrder: number;
  estimatedStartTime?: string;
  estimatedDuration: number;
  reasoning: string;
  energyLevel: 'high' | 'medium' | 'low';
};

type DailyPlanResult = {
  plannedTasks: PlannedTask[];
  summary: string;
  tips: string[];
  warnings?: string[];
};

type PrioritySuggestion = {
  taskId: string;
  currentPriority: Priority;
  suggestedPriority: Priority;
  urgencyScore: number;
  reasoning: string;
  factors: string[];
};

type AiPlanningDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskWithSubTasks[];
  onApplyPriority?: (taskId: string, priority: Priority) => void;
};

export function AiPlanningDialog({ isOpen, onClose, tasks, onApplyPriority }: AiPlanningDialogProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'daily-plan' | 'smart-priority'>('daily-plan');
  const [isLoading, setIsLoading] = useState(false);
  const [availableHours, setAvailableHours] = useState(8);
  const [dailyPlan, setDailyPlan] = useState<DailyPlanResult | null>(null);
  const [prioritySuggestions, setPrioritySuggestions] = useState<PrioritySuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const incompleteTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);

  const handleGenerateDailyPlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily-plan',
          tasks: incompleteTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString(),
            pomodoros: t.pomodoros,
            completedPomodoros: t.completedPomodoros,
            completed: t.completed,
            dependsOn: t.dependsOn,
            tags: t.tags,
            workspace: t.workspace,
          })),
          availableHours,
          currentTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const result = await response.json();
      setDailyPlan(result);
    } catch (err) {
      console.error('Planning error:', err);
      setError(t('aiPlanning.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePriorities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'smart-priority',
          tasks: incompleteTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString(),
            pomodoros: t.pomodoros,
            completedPomodoros: t.completedPomodoros,
            completed: t.completed,
            dependsOn: t.dependsOn,
            tags: t.tags,
            timeSpent: t.timeSpent,
          })),
          currentDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze priorities');

      const result = await response.json();
      setPrioritySuggestions(result);
    } catch (err) {
      console.error('Priority analysis error:', err);
      setError(t('aiPlanning.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskById = (taskId: string) => tasks.find(t => t.id === taskId);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
    }
  };

  const getEnergyColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-blue-500 bg-blue-500/10';
      case 'low': return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            {t('aiPlanning.title')}
          </DialogTitle>
          <DialogDescription>
            {t('aiPlanning.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily-plan' | 'smart-priority')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily-plan" className="gap-2">
              <Calendar className="w-4 h-4" />
              {t('aiPlanning.dailyPlan')}
            </TabsTrigger>
            <TabsTrigger value="smart-priority" className="gap-2">
              <Flag className="w-4 h-4" />
              {t('aiPlanning.smartPriority')}
            </TabsTrigger>
          </TabsList>

          {/* Daily Planning Tab */}
          <TabsContent value="daily-plan" className="space-y-4">
            {!dailyPlan ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('aiPlanning.availableHours')}</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[availableHours]}
                      onValueChange={(v) => setAvailableHours(v[0])}
                      min={1}
                      max={12}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="w-16 text-center font-medium">{availableHours}h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{incompleteTasks.length} {t('aiPlanning.tasksToAnalyze')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('aiPlanning.estimatedPomodoros')}: {incompleteTasks.reduce((sum, t) => sum + (t.pomodoros - t.completedPomodoros), 0)}
                    </p>
                  </div>
                  <Button onClick={handleGenerateDailyPlan} disabled={isLoading || incompleteTasks.length === 0}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('aiPlanning.generating')}</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />{t('aiPlanning.planMyDay')}</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {/* Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {t('aiPlanning.summary')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{dailyPlan.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Warnings */}
                  {dailyPlan.warnings && dailyPlan.warnings.length > 0 && (
                    <Card className="border-yellow-500/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-yellow-500">
                          <AlertTriangle className="w-4 h-4" />
                          {t('aiPlanning.warnings')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          {dailyPlan.warnings.map((warning, i) => (
                            <li key={i} className="text-yellow-500">• {warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Planned Tasks */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t('aiPlanning.plannedTasks')}
                    </h4>
                    {dailyPlan.plannedTasks.map((planned, idx) => {
                      const task = getTaskById(planned.taskId);
                      if (!task) return null;

                      return (
                        <motion.div
                          key={planned.taskId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                {planned.suggestedOrder}
                              </span>
                              <span className="font-medium">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getEnergyColor(planned.energyLevel)}>
                                {planned.energyLevel}
                              </Badge>
                              <Badge variant="outline">
                                {planned.estimatedDuration}m
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground pl-8">{planned.reasoning}</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Tips */}
                  {dailyPlan.tips.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          {t('aiPlanning.tips')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          {dailyPlan.tips.map((tip, i) => (
                            <li key={i}>💡 {tip}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Regenerate */}
                  <Button variant="outline" onClick={() => setDailyPlan(null)} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('aiPlanning.regenerate')}
                  </Button>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Smart Priority Tab */}
          <TabsContent value="smart-priority" className="space-y-4">
            {!prioritySuggestions ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('aiPlanning.priorityDescription')}
                  </p>
                  <Button onClick={handleGeneratePriorities} disabled={isLoading || incompleteTasks.length === 0}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('aiPlanning.analyzing')}</>
                    ) : (
                      <><Brain className="w-4 h-4 mr-2" />{t('aiPlanning.analyzePriorities')}</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {prioritySuggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>{t('aiPlanning.noChangesNeeded')}</p>
                    </div>
                  ) : (
                    prioritySuggestions.map((suggestion, idx) => {
                      const task = getTaskById(suggestion.taskId);
                      if (!task) return null;

                      const needsChange = suggestion.currentPriority !== suggestion.suggestedPriority;

                      return (
                        <motion.div
                          key={suggestion.taskId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={cn(
                            "p-4 border rounded-lg space-y-3",
                            needsChange && "border-primary/50"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getPriorityColor(suggestion.currentPriority)}>
                                  {suggestion.currentPriority}
                                </Badge>
                                {needsChange && (
                                  <>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    <Badge className={getPriorityColor(suggestion.suggestedPriority)}>
                                      {suggestion.suggestedPriority}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{suggestion.urgencyScore}</div>
                              <div className="text-xs text-muted-foreground">{t('aiPlanning.urgencyScore')}</div>
                            </div>
                          </div>

                          <Progress value={suggestion.urgencyScore} className="h-2" />

                          <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>

                          <div className="flex flex-wrap gap-1">
                            {suggestion.factors.map((factor, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>

                          {needsChange && onApplyPriority && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onApplyPriority(suggestion.taskId, suggestion.suggestedPriority)}
                              className="w-full"
                            >
                              {t('aiPlanning.applyChange')}
                            </Button>
                          )}
                        </motion.div>
                      );
                    })
                  )}

                  <Button variant="outline" onClick={() => setPrioritySuggestions(null)} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('aiPlanning.reanalyze')}
                  </Button>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
