'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useResetPassword } from '@/lib/hooks/use-auth';
import { Suspense } from 'react';
import Link from 'next/link';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[0-9]/, 'Password must include at least one number'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { mutate: resetPassword, isPending } = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-600 font-medium">Invalid or missing reset token.</p>
        <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-950">
          Back to login
        </Link>
      </div>
    );
  }

  const onSubmit = (data: FormData) => {
    resetPassword({ token, password: data.password });
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Set new password</h2>
      <p className="text-sm text-gray-500 mb-6">
        Please choose a strong password that you haven't used before.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          label="New password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" size="lg" loading={isPending}>
          Reset password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading reset session...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
