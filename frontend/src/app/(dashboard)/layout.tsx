'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#f7f7f5]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
