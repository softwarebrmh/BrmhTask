'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useOwnerSignup } from '@/lib/hooks/use-auth';

const schema = z
  .object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
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

export default function SignupPage() {
  const { mutate: signup, isPending } = useOwnerSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
        <h2 className="text-xl font-semibold text-gray-950">Create a company</h2>
        <p className="text-sm text-gray-500">Set up your workspace — you’ll be the owner.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Company name"
          placeholder="Acme Inc."
          autoComplete="organization"
          error={errors.companyName?.message}
          {...register('companyName')}
        />

        <Input
          label="Your full name"
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

        <Button type="submit" className="mt-2 w-full" size="lg" loading={isPending}>
          Create company
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Joining an existing team?{' '}
        <Link href="/join" className="font-semibold text-gray-800 transition-colors hover:text-gray-950">
          Join with a code
        </Link>
      </p>
    </div>
  );
}
