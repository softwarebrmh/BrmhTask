'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Clock, Users, TrendingUp, AlertTriangle, UserX,
  ArrowRight, Activity, Calendar, Flame,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { PageSpinner } from '@/components/ui/spinner';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/stores/auth.store';
import { dashboardApi } from '@/lib/api';
import { timeAgo, formatDate } from '@/lib/utils';
import type { OwnerDashboard, EmployeeDashboard } from '@/types';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: number | string; sub?: string;
  icon: any; accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold ${accent ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? 'bg-red-50' : 'bg-gray-50'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-red-500' : 'text-gray-500'}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Task status bar ──────────────────────────────────────────────────────────

function TaskStatusBar({ data }: { data: { todo: number; inProgress: number; review: number; done: number; total?: number } }) {
  const total = data.total || 1;
  const segments = [
    { key: 'done',       count: data.done,       color: 'bg-emerald-500', label: 'Done' },
    { key: 'review',     count: data.review,     color: 'bg-amber-400',   label: 'Review' },
    { key: 'inProgress', count: data.inProgress, color: 'bg-blue-500',    label: 'In Progress' },
    { key: 'todo',       count: data.todo,        color: 'bg-gray-200',    label: 'To Do' },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Task Overview</h3>
        <span className="text-xs text-gray-400">{data.total} total</span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full gap-0.5">
        {segments.map(({ key, count, color }) =>
          count > 0 ? (
            <div
              key={key}
              className={`${color} rounded-full transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
        {segments.map(({ key, count, color, label }) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${color}`} />
              <span className="text-gray-500">{label}</span>
            </div>
            <span className="font-semibold text-gray-900">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function ActivityFeed({ items }: { items: any[] }) {
  if (!items?.length) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-gray-400">
        No recent activity
      </div>
    );
  }
  return (
    <ul className="divide-y divide-gray-50">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3">
          {item.actor && <Avatar name={item.actor.fullName} size="xs" className="mt-0.5 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="font-medium">{item.actor?.fullName ?? 'System'}</span>
              {' '}
              <span className="text-gray-500">{item.action?.replace(/_/g, ' ').toLowerCase()}</span>
              {item.entityName && (
                <span className="font-medium text-gray-700"> · {item.entityName}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{timeAgo(item.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────

function OwnerDashboardView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin', companyId],
    queryFn: () => dashboardApi.admin(companyId).then((r) => r.data.data as OwnerDashboard),
    enabled: !!companyId,
  });

  if (isLoading) return <PageSpinner />;
  if (!data) return null;

  const deadlines = data.upcomingDeadlines ?? [];
  const workload = data.workload ?? [];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Employees" value={data.staff.active}   sub={`${data.staff.pending} pending invite`} icon={Users} />
        <StatCard label="Total Tasks" value={data.tasks.total ?? 0} icon={TrendingUp} />
        <StatCard label="Overdue" value={data.tasks.overdue ?? 0} icon={AlertTriangle} accent={(data.tasks.overdue ?? 0) > 0} />
        <StatCard label="Unassigned" value={data.tasks.unassigned ?? 0} icon={UserX} accent={(data.tasks.unassigned ?? 0) > 0} />
      </div>

      {/* Task status + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TaskStatusBar data={data.tasks} />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              Recent Activity
            </h3>
          </div>
          <ActivityFeed items={data.recentActivity} />
        </div>
      </div>

      {/* Upcoming deadlines + Team workload */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Upcoming Deadlines
            </h3>
            <Link href="/tasks" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {deadlines.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nothing due soon</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {deadlines.map((task) => (
                <li key={task.id} className="py-2.5">
                  <Link href={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 hover:opacity-75 transition-opacity">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{task.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {task.plannedDueDate ? `Due ${formatDate(task.plannedDueDate)}` : 'No due date'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      {task.assignees.length > 0 && <AvatarGroup users={task.assignees} max={2} />}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Flame className="h-4 w-4 text-gray-400" />
            Team Workload
          </h3>
          {workload.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No active assignments yet</p>
          ) : (
            <ul className="space-y-3">
              {workload.map(({ user, activeTaskCount }) => {
                const max = workload[0].activeTaskCount || 1;
                return (
                  <li key={user.id} className="flex items-center gap-3">
                    <Avatar name={user.fullName} src={user.avatarUrl} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{user.fullName}</span>
                    <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      <div className="h-full rounded-full bg-gray-900" style={{ width: `${(activeTaskCount / max) * 100}%` }} />
                    </div>
                    <span className="w-5 shrink-0 text-right text-xs font-semibold text-gray-900">{activeTaskCount}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Employee dashboard ────────────────────────────────────────────────────────

function EmployeeDashboardView() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'staff'],
    queryFn: () => dashboardApi.staff().then((r) => r.data.data as EmployeeDashboard),
  });

  if (isLoading) return <PageSpinner />;
  if (!data) return null;

  const tasks = data.myTasks;
  const upcoming = data.upcomingTasks ?? [];

  return (
    <div className="space-y-6">
      {/* My task stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'To Do',       value: tasks.todo,         color: 'text-gray-900' },
          { label: 'In Progress', value: tasks.inProgress,   color: 'text-blue-600' },
          { label: 'In Review',   value: tasks.review,       color: 'text-amber-600' },
          { label: 'Done',        value: tasks.done,         color: 'text-emerald-600' },
          { label: 'Overdue',     value: tasks.overdue ?? 0, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming tasks */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            My Tasks
          </h3>
          <Link href="/my-tasks" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No tasks assigned yet</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {upcoming.slice(0, 6).map((task) => (
              <li key={task.id} className="py-2.5">
                <Link href={`/tasks/${task.id}`} className="flex items-center justify-between gap-4 hover:opacity-75 transition-opacity">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{task.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.plannedDueDate ? `Due ${formatDate(task.plannedDueDate)}` : 'No due date'}
                    </p>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-gray-400" />
          Recent Activity
        </h3>
        <ActivityFeed items={data.recentActivity} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          {isOwner
            ? <OwnerDashboardView companyId={user?.companyId ?? ''} />
            : <EmployeeDashboardView />
          }
        </div>
      </main>
    </>
  );
}
