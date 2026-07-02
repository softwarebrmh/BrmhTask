'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Settings,
  CheckSquare, Bell, LogOut, Building2, ListTodo,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const ownerNav = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/tasks',     label: 'Tasks',       icon: ListTodo },
  { href: '/staff',     label: 'Employees',   icon: Users },
];

const employeeNav = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/my-tasks',      label: 'My Tasks',      icon: CheckSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const navItems = isOwner ? ownerNav : employeeNav;

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">BHRM Teams</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-4 space-y-0.5 border-t border-gray-100 pt-4">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Link>
        </div>
      </nav>

      {/* User profile + sign out */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">{user.fullName}</p>
              <p className="truncate text-xs text-gray-400 capitalize">{user.role === 'employee' ? 'Employee' : 'Owner'}</p>
            </div>
          </div>
        )}
        <button
          onClick={clearAuth}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
