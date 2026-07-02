'use client';

import Link from 'next/link';
import { Building2, UserPlus, ArrowRight } from 'lucide-react';

const OPTIONS = [
  {
    href: '/signup',
    icon: Building2,
    title: 'Create a company',
    subtitle: 'Start a new workspace and invite your team. You’ll be the owner.',
  },
  {
    href: '/join',
    icon: UserPlus,
    title: 'Join a company',
    subtitle: 'Have a join code or invite? Sign up as an employee.',
  },
] as const;

export default function GetStartedPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-950">Get started</h2>
        <p className="text-sm text-gray-500">How would you like to use BHRM Teams?</p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map(({ href, icon: Icon, title, subtitle }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-gray-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-950 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-gray-500">{subtitle}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-600" />
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-gray-800 transition-colors hover:text-gray-950">
          Sign in
        </Link>
      </p>
    </div>
  );
}
