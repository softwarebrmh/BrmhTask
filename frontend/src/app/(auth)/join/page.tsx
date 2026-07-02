'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useEmployeeSignup } from '@/lib/hooks/use-auth';
import { companyApi } from '@/lib/api';

const schema = z
  .object({
    companySlug: z.string().min(2, 'Enter your company join code'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; name: string }
  | { status: 'error'; message: string };

export default function JoinPage() {
  const { mutate: signup, isPending } = useEmployeeSignup();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const code = watch('companySlug');
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });

  // Debounced live validation of the company join code.
  useEffect(() => {
    const trimmed = code?.trim();
    if (!trimmed || trimmed.length < 2) {
      setLookup({ status: 'idle' });
      return;
    }
    setLookup({ status: 'loading' });
    const t = setTimeout(async () => {
      try {
        const res = await companyApi.lookup(trimmed);
        setLookup({ status: 'found', name: res.data.data.name });
      } catch {
        setLookup({ status: 'error', message: 'No company found for this code' });
      }
    }, 450);
    return () => clearTimeout(t);
  }, [code]);

  const onSubmit = ({ confirmPassword, ...rest }: FormData) => {
    signup(rest);
  };

  return (
    <div className="w-full">
      <Link
        href="/get-started"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-950">Join a company</h2>
        <p className="text-sm text-gray-500">Enter the join code your owner shared with you.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            label="Company join code"
            placeholder="acme-inc-3f9a2b"
            autoCapitalize="none"
            autoCorrect="off"
            error={errors.companySlug?.message}
            {...register('companySlug')}
          />
          {lookup.status === 'loading' && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking code…
            </p>
          )}
          {lookup.status === 'found' && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Joining {lookup.name}
            </p>
          )}
          {lookup.status === 'error' && !errors.companySlug && (
            <p className="mt-1.5 text-xs text-red-600">{lookup.message}</p>
          )}
        </div>

        <Input
          label="Full name"
          placeholder="Jane Smith"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="mt-2 w-full"
          size="lg"
          loading={isPending}
          disabled={lookup.status === 'error'}
        >
          Join company
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Starting a new company?{' '}
        <Link href="/signup" className="font-semibold text-gray-800 transition-colors hover:text-gray-950">
          Create one
        </Link>
      </p>
    </div>
  );
}
