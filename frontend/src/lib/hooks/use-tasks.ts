import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, usersApi } from '@/lib/api';
import { extractError } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { TaskStatus, TaskPriority } from '@/types';

export const taskKeys = {
  all: ['tasks'] as const,
  mine: (params?: unknown) => [...taskKeys.all, 'mine', params] as const,
  detail: (taskId: string) => [...taskKeys.all, 'detail', taskId] as const,
};

export function useMyTasks(
  params?: { status?: TaskStatus; priority?: TaskPriority; search?: string; parentTaskId?: string; page?: number },
) {
  return useQuery({
    queryKey: taskKeys.mine(params),
    queryFn: () => usersApi.tasks({ ...params, parentTaskId: params?.parentTaskId ?? 'null' }).then((r) => r.data),
  });
}

export function useTaskDetail(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => tasksApi.getById(taskId).then((r) => r.data.data),
    enabled: !!taskId,
  });
}

export function useUpdateTaskStatus(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TaskStatus) => tasksApi.updateStatus(taskId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useUpdateTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[1]) => tasksApi.update(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      toast.success('Task updated');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

