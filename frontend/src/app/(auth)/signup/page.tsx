'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useEmployeeSignup } from '@/lib/hooks/use-auth';

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    companySlug: z.string().optional().default(''),
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
  const { mutate: signup, isPending } = useEmployeeSignup();

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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-950">Create your account</h2>
        <p className="text-sm text-gray-500">Join your company workspace as an employee</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <div>
          <Input
            label="Company code"
            placeholder="Ask your admin for this code"
            autoCapitalize="none"
            autoCorrect="off"
            disabled
            error={errors.companySlug?.message}
            {...register('companySlug')}
          />
          <p className="mt-1 text-xs text-gray-400">Company code will be enabled soon.</p>
        </div>

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

        <Button type="submit" className="w-full mt-2" size="lg" loading={isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-gray-800 hover:text-gray-950 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
