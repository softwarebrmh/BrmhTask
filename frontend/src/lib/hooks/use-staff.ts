import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import { extractError } from '@/lib/utils';
import toast from 'react-hot-toast';

export const staffKeys = {
  all: ['staff'] as const,
  list: (companyId: string) => [...staffKeys.all, companyId] as const,
};

export function useStaff(companyId: string, params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: [...staffKeys.list(companyId), params],
    queryFn: () => staffApi.list(companyId, params).then((r) => r.data),
    enabled: !!companyId,
  });
}

export function useInviteStaff(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => staffApi.invite(companyId, { email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.list(companyId) });
      toast.success('Invitation sent');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useSuspendStaff(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => staffApi.suspend(companyId, staffId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.list(companyId) });
      toast.success('Staff member suspended');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useActivateStaff(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => staffApi.activate(companyId, staffId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.list(companyId) });
      toast.success('Staff member activated');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useResendInvite(companyId: string) {
  return useMutation({
    mutationFn: (staffId: string) => staffApi.resendInvite(companyId, staffId),
    onSuccess: () => toast.success('Invite resent'),
    onError: (err) => toast.error(extractError(err)),
  });
}
