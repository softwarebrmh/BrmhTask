import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, sprintsApi } from '@/lib/api';
import { extractError } from '@/lib/utils';
import toast from 'react-hot-toast';

export const projectKeys = {
  all: ['projects'] as const,
  list: (companyId: string) => [...projectKeys.all, companyId] as const,
  detail: (companyId: string, id: string) => [...projectKeys.all, 'detail', companyId, id] as const,
};

export const sprintKeys = {
  all: ['sprints'] as const,
  list: (projectId: string) => [...sprintKeys.all, projectId] as const,
  detail: (projectId: string, id: string) => [...sprintKeys.all, 'detail', projectId, id] as const,
};

export function useProjects(companyId: string, params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: [...projectKeys.list(companyId), params],
    queryFn: () => projectsApi.list(companyId, params).then((r) => r.data),
    enabled: !!companyId,
  });
}

export function useProject(companyId: string, projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(companyId, projectId),
    queryFn: () => projectsApi.getById(companyId, projectId).then((r) => r.data.data),
    enabled: !!companyId && !!projectId,
  });
}

export function useCreateProject(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      projectsApi.create(companyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.list(companyId) });
      toast.success('Project created');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useUpdateProject(companyId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{ name: string; description: string }>) =>
      projectsApi.update(companyId, projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.list(companyId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(companyId, projectId) });
      toast.success('Project updated');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useArchiveProject(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.archive(companyId, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.list(companyId) });
      toast.success('Project archived');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: sprintKeys.list(projectId),
    queryFn: () => sprintsApi.list(projectId).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useSprint(projectId: string, sprintId: string) {
  return useQuery({
    queryKey: sprintKeys.detail(projectId, sprintId),
    queryFn: () => sprintsApi.getById(projectId, sprintId).then((r) => r.data.data),
    enabled: !!projectId && !!sprintId,
  });
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; goal?: string; startDate?: string; endDate?: string }) =>
      sprintsApi.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      toast.success('Sprint created');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useStartSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.start(projectId, sprintId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      toast.success('Sprint started');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useEndSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintsApi.end(projectId, sprintId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) });
      toast.success('Sprint completed');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}
