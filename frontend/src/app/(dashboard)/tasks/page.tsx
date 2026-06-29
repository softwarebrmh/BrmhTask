'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, SlidersHorizontal, CheckSquare } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { PageSpinner } from '@/components/ui/spinner';
import { TaskCard } from '@/components/tasks/task-card';
import { useMyTasks, taskKeys } from '@/lib/hooks/use-tasks';
import { tasksApi } from '@/lib/api';
import type { TaskPriority, TaskStatus } from '@/types';

const STATUS_OPTIONS: Array<{ value: TaskStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | ''; label: string }> = [
  { value: '', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function TasksPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');

  const params = {
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
  };
  const { data, isLoading } = useMyTasks(params);
  const tasks = data?.data ?? [];

  return (
    <>
      <Header title="Tasks" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-950">My task workspace</p>
              <p className="mt-1 text-sm text-gray-500">{data?.meta?.total ?? 0} visible tasks</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 sm:w-72">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks"
                  className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <PageSpinner />
          ) : tasks.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 text-center">
              <CheckSquare className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">No tasks found</p>
              <p className="mt-1 text-sm text-gray-400">
                <SlidersHorizontal className="mr-1 inline h-3.5 w-3.5" />
                Adjust filters or open a sprint to create tasks.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(nextStatus) => {
                    tasksApi.updateStatus(task.id, nextStatus).then(() => {
                      qc.invalidateQueries({ queryKey: taskKeys.mine(params) });
                      qc.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
