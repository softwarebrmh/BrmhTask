'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { RememberMe } from '@/components/auth/RememberMe';
import { useLogin } from '@/lib/hooks/use-auth';

const schema = z.object({
  email: z.string().email('Enter a valid company email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

const DEMO_CREDENTIALS = [
  { label: 'Admin', email: 'admin@demo.com', password: 'Admin1234!' },
  { label: 'Staff', email: 'staff@demo.com', password: 'Staff1234!' },
] as const;

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [savedEmail, setSavedEmail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('remembered_email');
      if (email) setSavedEmail(email);
    }
  }, []);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: savedEmail || '', password: '', rememberMe: !!savedEmail },
    values: { email: savedEmail, password: '', rememberMe: !!savedEmail },
  });

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  const onSubmit = (data: FormData) => {
    if (typeof window !== 'undefined') {
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
    }
    login({ email: data.email, password: data.password });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-950">Welcome Back</h2>
        <p className="text-sm text-gray-500">Sign in to access your dashboard</p>
      </div>

      {/* Demo credentials banner */}
      <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Demo credentials
        </p>
        <div className="flex gap-2">
          {DEMO_CREDENTIALS.map(({ label, email, password }) => (
            <button
              key={label}
              type="button"
              onClick={() => fillDemo(email, password)}
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-xs transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              <span className="block font-semibold text-gray-900">{label}</span>
              <span className="block truncate text-gray-500">{email}</span>
              <span className="block text-gray-400">{password}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Click a card to auto-fill the form.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <RememberMe checked={field.value} onChange={field.onChange} />
            )}
          />
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-gray-700 transition-colors hover:text-gray-950"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" loading={isPending}>
          Sign in
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm font-medium">
          <span className="bg-white px-3 text-gray-500">or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => alert('Google authentication is not configured for MVP local environment.')}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
          <g transform="matrix(1, 0, 0, 1, 0, 0)">
            <path
              d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.43 21.35,11.1z"
              fill="#4285F4"
            />
            <path
              d="M12,20.5c2.3,0 4.23,-0.76 5.64,-2.08l-3.3,-2.58c-0.92,0.62 -2.1,0.98 -3.44,0.98 -2.64,0 -4.88,-1.78 -5.68,-4.17H1.72v2.66C3.12,18.06 7.27,20.5 12,20.5z"
              fill="#34A853"
            />
            <path
              d="M6.32,12.65C6.12,12.05 6.01,11.41 6.01,10.75c0,-0.66 0.11,-1.3 0.31,-1.9V6.19H1.72C1.07,7.5 0.7,8.98 0.7,10.56c0,1.58 0.37,3.06 1.02,4.37L6.32,12.65z"
              fill="#FBBC05"
            />
            <path
              d="M12,4.91c1.25,0 2.37,0.43 3.25,1.27l2.44,-2.44C16.22,2.32 14.29,1.5 12,1.5C7.27,1.5 3.12,3.94 1.72,7.7l4.6,3.6C7.12,8.91 9.36,7.13 12,4.91z"
              fill="#EA4335"
            />
          </g>
        </svg>
        Google
      </button>
    </div>
  );
}
