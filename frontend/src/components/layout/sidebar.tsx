'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Settings,
  CheckSquare, Bell, LogOut, Building2, ListTodo, X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUiStore } from '@/lib/stores/ui.store';
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

function NavLink({ href, label, icon: Icon, active, onNavigate }: {
  href: string; label: string; icon: any; active: boolean; onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-gray-900 text-white shadow-[0_1px_2px_rgba(15,23,42,0.2)]'
          : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const isOwner = user?.role === 'owner';
  const navItems = isOwner ? ownerNav : employeeNav;

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const closeMobile = () => setSidebarOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-950/40 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'z-40 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200/70 bg-white',
          'fixed inset-y-0 left-0 transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-950 shadow-[0_1px_2px_rgba(15,23,42,0.3)]">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-gray-900">BHRM Teams</span>
          </div>
          <button
            onClick={closeMobile}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Workspace
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} onNavigate={closeMobile} />
            ))}
          </div>

          <p className="mt-6 px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Account
          </p>
          <div className="space-y-0.5">
            <NavLink
              href="/settings"
              label="Settings"
              icon={Settings}
              active={pathname.startsWith('/settings')}
              onNavigate={closeMobile}
            />
          </div>
        </nav>

        {/* User profile + sign out */}
        <div className="border-t border-gray-100 p-3">
          {user && (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-gray-900">{user.fullName}</p>
                <p className="truncate text-xs text-gray-400">{user.role === 'employee' ? 'Employee' : 'Owner'}</p>
              </div>
              <button
                onClick={clearAuth}
                title="Sign out"
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
