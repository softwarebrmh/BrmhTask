'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/stores/auth.store';
import { companyApi, usersApi } from '@/lib/api';
import { extractError } from '@/lib/utils';
import toast from 'react-hot-toast';

const companySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
});

const profileSchema = z.object({
  fullName: z.string().min(2),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

type CompanyForm = z.infer<typeof companySchema>;
type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function CompanySettings({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyApi.getById(companyId).then((r) => r.data.data),
  });

  const update = useMutation({
    mutationFn: (d: CompanyForm) => companyApi.update(companyId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); toast.success('Company updated'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    values: company ? { name: company.name, workingHoursStart: company.workingHoursStart, workingHoursEnd: company.workingHoursEnd } : undefined,
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />;

  return (
    <form onSubmit={form.handleSubmit((d) => update.mutate(d))} className="surface space-y-4 p-6">
      <h3 className="text-sm font-semibold text-gray-950">Company Settings</h3>
      <Input label="Company name" error={form.formState.errors.name?.message} {...form.register('name')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Working hours start" placeholder="09:00" error={form.formState.errors.workingHoursStart?.message} {...form.register('workingHoursStart')} />
        <Input label="Working hours end" placeholder="18:00" error={form.formState.errors.workingHoursEnd?.message} {...form.register('workingHoursEnd')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={update.isPending}>Save changes</Button>
      </div>
    </form>
  );
}

function ProfileSettings() {
  const { user, setAuth, accessToken } = useAuthStore();
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const updateProfile = useMutation({
    mutationFn: (d: ProfileForm) => usersApi.updateProfile(d),
    onSuccess: ({ data }) => {
      if (user && accessToken) setAuth({ ...user }, accessToken);
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const changePassword = useMutation({
    mutationFn: (d: PasswordForm) => usersApi.changePassword(d),
    onSuccess: () => { passwordForm.reset(); toast.success('Password changed'); },
    onError: (e) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-4">
      <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="surface space-y-4 p-6">
        <h3 className="text-sm font-semibold text-gray-950">Profile</h3>
        <Input label="Full name" placeholder="Jane Smith" error={profileForm.formState.errors.fullName?.message} {...profileForm.register('fullName')} />
        <Input label="Email address" type="email" value={user?.email ?? ''} disabled />
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={updateProfile.isPending}>Update profile</Button>
        </div>
      </form>

      <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))} className="surface space-y-4 p-6">
        <h3 className="text-sm font-semibold text-gray-950">Change Password</h3>
        <Input label="Current password" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
        <Input label="New password" type="password" hint="Min 8 chars, 1 uppercase, 1 number" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={changePassword.isPending}>Change password</Button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {isOwner && user?.companyId && <CompanySettings companyId={user.companyId} />}
          <ProfileSettings />
        </div>
      </main>
    </>
  );
}
