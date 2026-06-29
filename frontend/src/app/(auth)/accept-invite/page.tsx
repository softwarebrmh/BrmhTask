'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useAcceptInvite } from '@/lib/hooks/use-auth';
import { Suspense } from 'react';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions to proceed' }),
  }),
});
type FormData = z.infer<typeof schema>;

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { mutate: accept, isPending } = useAcceptInvite();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      password: '',
      acceptTerms: false as any,
    }
  });

  if (!token) {
    return <p className="text-sm text-red-600 font-semibold text-center">Invalid or missing invite token.</p>;
  }

  return (
    <>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Accept your invitation</h2>
      <p className="text-sm text-gray-500 mb-6">Set up your account to join the company.</p>
      
      <form onSubmit={handleSubmit((d) => accept({ token, ...d }))} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Smith"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        
        <PasswordInput
          label="Password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-start pt-1">
          <div className="flex h-5 items-center">
            <input
              id="acceptTerms"
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-gray-950 focus:ring-gray-900/10 focus:ring-offset-0"
              {...register('acceptTerms')}
            />
          </div>
          <div className="ml-2.5 text-sm">
            <label htmlFor="acceptTerms" className="text-gray-700 select-none cursor-pointer">
              I accept the <span className="font-semibold text-gray-800 hover:underline">Terms & Conditions</span> and <span className="font-semibold text-gray-800 hover:underline">Privacy Policy</span>
            </label>
            {errors.acceptTerms && (
              <p className="text-xs text-red-600 mt-1">{errors.acceptTerms.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" loading={isPending}>
          Create account & Join
        </Button>
      </form>
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading invite session...</p>}>
      <AcceptInviteForm />
    </Suspense>
  );
}
