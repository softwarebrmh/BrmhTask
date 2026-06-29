'use client';

import Link from 'next/link';
import { Calendar, Clock, CheckSquare } from 'lucide-react';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badge';
import { AvatarGroup } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

interface TaskCardProps {
  task: Task;
  onStatusChange?: (status: TaskStatus) => void;
  isAdmin?: boolean;
}

export function TaskCard({ task, onStatusChange, isAdmin }: TaskCardProps) {
  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const nextStatus = STATUS_ORDER[currentIdx + 1] as TaskStatus | undefined;
  const prevStatus = STATUS_ORDER[currentIdx - 1] as TaskStatus | undefined;

  const isOverdue =
    task.plannedDueDate &&
    task.status !== 'done' &&
    new Date(task.plannedDueDate) < new Date();

  return (
    <div className="group surface p-4 transition-all hover:border-gray-300 hover:bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
          <p className="line-clamp-2 text-sm font-medium text-gray-950 group-hover:text-gray-700">{task.name}</p>
        </Link>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <TaskStatusBadge status={task.status} />
        {task.parentTaskId && (
          <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">sub-task</span>
        )}
        {task.subTaskCount > 0 && (
          <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">{task.subTaskCount} sub-tasks</span>
        )}
      </div>

      {task.stepProgress.total > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" /> Steps</span>
            <span>{task.stepProgress.completed}/{task.stepProgress.total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-gray-900 transition-all" style={{ width: `${task.stepProgress.percentage}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {task.plannedDueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar className="h-3 w-3" />{formatDate(task.plannedDueDate)}
            </span>
          )}
          {task.estimatedEffortPh > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{task.estimatedEffortPh}h
            </span>
          )}
        </div>
        {task.assignees.length > 0 && <AvatarGroup users={task.assignees} max={3} />}
      </div>

      {onStatusChange && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
          {prevStatus && (
            <button
              onClick={() => onStatusChange(prevStatus)}
              className="flex-1 rounded-md border border-gray-200 py-1 text-xs text-gray-500 hover:bg-gray-50"
            >
              ← {prevStatus.replace('_', ' ')}
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onStatusChange(nextStatus)}
              className="flex-1 rounded-md border border-gray-300 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {nextStatus.replace('_', ' ')} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
