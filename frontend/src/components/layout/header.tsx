'use client';

import Link from 'next/link';
import { Bell, Menu } from 'lucide-react';
import { useUiStore } from '@/lib/stores/ui.store';

interface HeaderProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const { toggleSidebar } = useUiStore();
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-gray-200/70 bg-white/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold tracking-tight text-gray-950">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Link
          href="/notifications"
          className="relative rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  );
}
