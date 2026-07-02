'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, RefreshCw, Ban, UserCheck, ListTodo } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StaffStatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageSpinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useStaff, useInviteStaff, useSuspendStaff, useActivateStaff, useResendInvite } from '@/lib/hooks/use-staff';
import { formatDate } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

function StaffPageContent() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? '';
  const [showInvite, setShowInvite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useStaff(companyId, { status: statusFilter || undefined });
  const invite = useInviteStaff(companyId);
  const suspend = useSuspendStaff(companyId);
  const activate = useActivateStaff(companyId);
  const resend = useResendInvite(companyId);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (d: FormData) => {
    invite.mutate(d.email, { onSuccess: () => { setShowInvite(false); reset(); } });
  };

  const staff = data?.data ?? [];

  return (
    <>
      <Header
        title="Employees"
        actions={
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <Plus className="h-4 w-4" /> Invite Employee
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All statuses</option>
            <option value="invited">Invited</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <span className="text-sm text-gray-400">{data?.meta?.total ?? 0} members</span>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : (
          <div className="surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Tasks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No employees found</td>
                  </tr>
                ) : (
                  staff.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.user?.fullName || s.user?.email || s.email} src={s.user?.avatarUrl} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{s.user?.fullName || '—'}</p>
                            <p className="text-xs text-gray-500">{s.user?.email || s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StaffStatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        {s.user ? (
                          <Link
                            href={`/tasks?assigneeId=${s.user.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                          >
                            <ListTodo className="h-3.5 w-3.5 text-gray-400" />
                            {s.activeTaskCount}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.joinedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {s.status === 'invited' && (
                            <button
                              onClick={() => resend.mutate(s.id)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                            >
                              <RefreshCw className="h-3 w-3" /> Resend
                            </button>
                          )}
                          {s.status === 'active' && (
                            <button
                              onClick={() => suspend.mutate(s.id)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                            >
                              <Ban className="h-3 w-3" /> Suspend
                            </button>
                          )}
                          {s.status === 'suspended' && (
                            <button
                              onClick={() => activate.mutate(s.id)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50"
                            >
                              <UserCheck className="h-3 w-3" /> Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal open={showInvite} onClose={() => { setShowInvite(false); reset(); }} title="Invite Employee">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@company.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <p className="text-xs text-gray-500">They'll receive an email with a link to set up their account.</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowInvite(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={invite.isPending}>Send invitation</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={['owner']}>
      <StaffPageContent />
    </ProtectedRoute>
  );
}
