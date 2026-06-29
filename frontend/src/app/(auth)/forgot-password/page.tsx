'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForgotPassword } from '@/lib/hooks/use-auth';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Reset your password</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter the email address associated with your account and we will send you a password reset link.
      </p>

      {isSuccess ? (
        <div className="rounded-lg bg-green-50 p-4 border border-green-200 mb-6">
          <p className="text-sm text-green-700 font-medium">
            If your email is registered in our system, you will receive a reset link shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => forgotPassword(d))} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" className="w-full" size="lg" loading={isPending}>
            Send reset link
          </Button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 transition-colors hover:text-gray-950"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
