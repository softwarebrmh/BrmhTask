'use client';

import { Bell, Menu } from 'lucide-react';
import { useUiStore } from '@/lib/stores/ui.store';

interface HeaderProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const { toggleSidebar } = useUiStore();
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/80 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-950">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button className="relative rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
