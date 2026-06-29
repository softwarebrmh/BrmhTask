'use client';

import { Bell, CheckSquare, MessageSquare, UserPlus, AlertTriangle, Clock } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Avatar } from '@/components/ui/avatar';

// ─── Placeholder data ──────────────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  {
    icon: UserPlus,
    color: 'bg-blue-50 text-blue-600',
    title: 'Task assigned',
    description: 'Admin assigned you to "Redesign onboarding flow"',
    time: '2 hours ago',
    unread: true,
  },
  {
    icon: MessageSquare,
    color: 'bg-purple-50 text-purple-600',
    title: 'Mentioned in comment',
    description: 'Alex mentioned you in a comment on "API integration task"',
    time: '5 hours ago',
    unread: true,
  },
  {
    icon: AlertTriangle,
    color: 'bg-red-50 text-red-500',
    title: 'Task overdue',
    description: '"Backend schema review" was due yesterday and is not complete',
    time: '1 day ago',
    unread: false,
  },
  {
    icon: CheckSquare,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Task completed',
    description: 'Sarah completed "Write unit tests for auth module"',
    time: '2 days ago',
    unread: false,
  },
  {
    icon: Clock,
    color: 'bg-amber-50 text-amber-600',
    title: 'Sprint deadline approaching',
    description: 'Sprint 3 ends in 2 days — 4 tasks still open',
    time: '3 days ago',
    unread: false,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const unreadCount = NOTIFICATION_TYPES.filter((n) => n.unread).length;

  return (
    <>
      <Header
        title={
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {unreadCount} new
              </span>
            )}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl space-y-4">

          <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">All notifications</h2>
              {unreadCount > 0 && (
                <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium">
                  Mark all as read
                </button>
              )}
            </div>

            <ul className="divide-y divide-gray-50">
              {NOTIFICATION_TYPES.map((n, i) => {
                const Icon = n.icon;
                return (
                  <li
                    key={i}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                      n.unread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${n.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">{n.time}</span>
                          {n.unread && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{n.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white px-5 py-8 text-center">
            <Bell className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">Real-time notifications coming soon</p>
            <p className="text-xs text-gray-300 mt-1">
              You'll be notified for task assignments, mentions, deadlines, and sprint updates.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
