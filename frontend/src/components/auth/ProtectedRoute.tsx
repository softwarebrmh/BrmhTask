'use client';

import { useAuthStore } from '@/lib/stores/auth.store';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'staff')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return null; // Will be handled by AuthGuard
  }

  const hasAccess = user && allowedRoles.includes(user.role as 'admin' | 'staff');

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f5] px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">403 Access Denied</h1>
            <p className="text-sm text-gray-500">
              You do not have the required permissions to view this page. If you believe this is an error, please contact your administrator.
              Your current role: <strong className="capitalize">{user?.role}</strong>
            </p>
          </div>
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
