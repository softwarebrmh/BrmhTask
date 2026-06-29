import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, usersApi } from '@/lib/api';
import { extractError } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { TaskStatus, TaskPriority } from '@/types';

export const taskKeys = {
  all: ['tasks'] as const,
  mine: (params?: unknown) => [...taskKeys.all, 'mine', params] as const,
  sprint: (sprintId: string) => [...taskKeys.all, 'sprint', sprintId] as const,
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

export function useSprintTasks(
  sprintId: string,
  params?: { status?: TaskStatus; priority?: TaskPriority; search?: string; parentTaskId?: string; page?: number },
) {
  return useQuery({
    queryKey: [...taskKeys.sprint(sprintId), params],
    queryFn: () => tasksApi.list(sprintId, params).then((r) => r.data),
    enabled: !!sprintId,
  });
}

export function useTaskDetail(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => tasksApi.getById(taskId).then((r) => r.data.data),
    enabled: !!taskId,
  });
}

export function useCreateTask(sprintId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.create>[1]) => tasksApi.create(sprintId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.sprint(sprintId) });
      toast.success('Task created');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useUpdateTaskStatus(taskId: string, sprintId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TaskStatus) => tasksApi.updateStatus(taskId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.sprint(sprintId) });
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useUpdateTask(taskId: string, sprintId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[1]) => tasksApi.update(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      if (sprintId) qc.invalidateQueries({ queryKey: taskKeys.sprint(sprintId) });
      toast.success('Task updated');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useDeleteTask(sprintId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.sprint(sprintId) });
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useAssignTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assigneeIds: string[]) => tasksApi.assign(taskId, assigneeIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      toast.success('Assignees updated');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}
