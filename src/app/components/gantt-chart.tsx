'use client';
 import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
 import type { Task } from '@/lib/types';
 import { useMemo } from 'react';
 import { format } from 'date-fns';
 interface GanttChartProps {
 tasks: Task[];
 }
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
 };
 })
 .sort((a, b) => a.range[0] - b.range[0]); // Sort by start date
 };

 export function GanttChart({ tasks }: GanttChartProps) {
 const chartData = useMemo(() => processTasksForGantt(tasks), [tasks]);
 return (
 <div style={{ width: '100%', height: 500 }}>
 <ResponsiveContainer>
 <BarChart
 data={chartData}
 layout="vertical"
 margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
 >
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis
 type="number"
 domain={['dataMin', 'dataMax']}
 tickFormatter={(time) => format(new Date(time), 'MMM d')}
 scale="time"
 />
 <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
 <Tooltip
 content={({ payload }) => {
 if (payload && payload.length > 0) {
 const data = payload[0].payload;
 return (
 <div className="bg-background border p-2 rounded shadow-lg">
 <p className="font-bold">{data.name}</p>
 <p className="text-sm text-muted-foreground">
 {format(new Date(data.range[0]), 'MMM d')} - {format(new Date(data.range[1]), 'MMM d')}
 </p>
 </div>
 );
 }
 return null;
 }}
 />
 <Bar dataKey="range" fill="hsl(var(--primary))" barSize={20} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 );
 }
