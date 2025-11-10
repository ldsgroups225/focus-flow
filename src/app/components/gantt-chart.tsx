'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import type { Task } from '@/lib/types';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface GanttChartProps {
  tasks: Task[];
}

// Priority color mapping with vibrant colors
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#ef4444'; // Vibrant red
    case 'medium':
      return '#f59e0b'; // Vibrant orange
    case 'low':
      return '#10b981'; // Vibrant green
    default:
      return '#6366f1'; // Vibrant indigo
  }
};

// Helper to process tasks for the chart
const processTasksForGantt = (tasks: Task[]) => {
  return tasks
    .filter(task => task.dueDate) // Only include tasks with due dates
    .map(task => {
      const endDate = new Date(task.dueDate!);
      // Estimate start date and duration if not present
      const duration = task.duration || (task.pomodoros / 2) || 1; // e.g., 2 pomodoros per day
      const startDate = task.startDate || new Date(endDate.getTime() - duration * 24 * 60 * 60 * 1000);

      return {
        name: task.title,
        // The chart needs a range, specified as [start, end] in milliseconds
        range: [startDate.getTime(), endDate.getTime()],
        // Store original task for tooltips, etc.
        originalTask: task,
        priority: task.priority,
        completed: task.completed,
      };
    })
    .sort((a, b) => a.range[0] - b.range[0]); // Sort by start date
};

export function GanttChart({ tasks }: GanttChartProps) {
  const chartData = useMemo(() => processTasksForGantt(tasks), [tasks]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: '#10b981' }} />
          <span className="text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-muted opacity-50" />
          <span className="text-muted-foreground">Done</span>
        </div>
      </div>

      {/* Chart - Responsive container */}
      <div className="w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[600px] md:min-w-0" style={{ height: Math.max(300, chartData.length * 50 + 100) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(time) => format(new Date(time), 'MMM d')}
                scale="time"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                height={40}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.15 }}
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    const task = data.originalTask;
                    return (
                      <div className="bg-popover border-2 border-border p-3 rounded-lg shadow-xl max-w-xs">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-sm leading-tight">{data.name}</p>
                          {data.completed && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Done
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">Duration:</span>{' '}
                            {format(new Date(data.range[0]), 'MMM d')} - {format(new Date(data.range[1]), 'MMM d')}
                          </p>
                          {task.priority && (
                            <p>
                              <span className="font-medium text-foreground">Priority:</span>{' '}
                              <span className="capitalize">{task.priority}</span>
                            </p>
                          )}
                          {task.pomodoros > 0 && (
                            <p>
                              <span className="font-medium text-foreground">Pomodoros:</span> {task.pomodoros}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="range"
                barSize={28}
                radius={[6, 6, 6, 6]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.completed ? '#94a3b8' : getPriorityColor(entry.priority)}
                    opacity={entry.completed ? 0.5 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
