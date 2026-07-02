'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users, TrendingUp, AlertTriangle, UserX,
  ArrowRight, Activity, Calendar, Flame, Plus,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/stores/auth.store';
import { dashboardApi } from '@/lib/api';
import { timeAgo, formatDate } from '@/lib/utils';
import type { OwnerDashboard, EmployeeDashboard } from '@/types';

// ─── Greeting ─────────────────────────────────────────────────────────────────

function Greeting({ name, action }: { name?: string; action?: React.ReactNode }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{today}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">
          {greeting}{name ? `, ${name.split(' ')[0]}` : ''}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, tone = 'neutral' }: {
  label: string; value: number | string; sub?: string;
  icon: any; tone?: 'neutral' | 'danger' | 'success';
}) {
  const tones = {
    neutral: { value: 'text-gray-950',   chip: 'bg-gray-100 text-gray-500' },
    danger:  { value: 'text-red-600',    chip: 'bg-red-50 text-red-500' },
    success: { value: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-500' },
  }[tone];

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
          <p className={`mt-1.5 text-[26px] font-bold leading-none tracking-tight ${tones.value}`}>{value}</p>
          {sub && <p className="mt-1.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones.chip}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  );
}

// ─── Task status bar ──────────────────────────────────────────────────────────

function TaskStatusBar({ data }: { data: { todo: number; inProgress: number; review: number; done: number; total?: number } }) {
  const total = data.total || 1;
  const segments = [
    { key: 'done',       count: data.done,       color: 'bg-emerald-500', label: 'Completed' },
    { key: 'review',     count: data.review,     color: 'bg-violet-400',  label: 'Review' },
    { key: 'inProgress', count: data.inProgress, color: 'bg-sky-500',     label: 'In Progress' },
    { key: 'todo',       count: data.todo,       color: 'bg-gray-300',    label: 'To Do' },
  ];

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Task Overview</h3>
        <span className="text-xs font-medium text-gray-400">{data.total} total</span>
      </div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
        {segments.map(({ key, count, color }) =>
          count > 0 ? (
            <div
              key={key}
              className={`${color} rounded-full transition-all duration-500`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          ) : null,
        )}
        {total === 0 && <div className="h-full w-full rounded-full bg-gray-100" />}
      </div>
      <div className="mt-4 space-y-2.5">
        {segments.map(({ key, count, color, label }) => (
          <div key={key} className="flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${color}`} />
              <span className="text-gray-500">{label}</span>
            </div>
            <span className="font-semibold tabular-nums text-gray-900">{count}</span>
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
            <p className="text-[13px] leading-relaxed text-gray-700">
              <span className="font-medium text-gray-900">{item.actor?.fullName ?? 'System'}</span>
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

// ─── Due date label with urgency ──────────────────────────────────────────────

function DueLabel({ date }: { date?: string | null }) {
  if (!date) return <p className="mt-0.5 text-xs text-gray-400">No due date</p>;
  const due = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.setHours(0, 0, 0, 0) - today.getTime()) / 86400000);

  const cls = days < 0 ? 'text-red-600 font-medium' : days === 0 ? 'text-amber-600 font-medium' : 'text-gray-400';
  const text = days < 0
    ? `Overdue · was due ${formatDate(date)}`
    : days === 0 ? 'Due today' : `Due ${formatDate(date)}`;

  return <p className={`mt-0.5 text-xs ${cls}`}>{text}</p>;
}

// ─── Owner dashboard ──────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardSkeleton className="lg:col-span-1 h-56" />
        <CardSkeleton className="lg:col-span-2 h-56" />
      </div>
    </div>
  );
}

function OwnerDashboardView({ companyId }: { companyId: string }) {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin', companyId],
    queryFn: () => dashboardApi.admin(companyId).then((r) => r.data.data as OwnerDashboard),
    enabled: !!companyId,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const deadlines = data.upcomingDeadlines ?? [];
  const workload = data.workload ?? [];

  return (
    <div className="space-y-6">
      <Greeting
        name={user?.fullName}
        action={
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(15,23,42,0.24)] transition-colors hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" /> New Task
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Employees" value={data.staff.active} sub={`${data.staff.pending} pending invite`} icon={Users} />
        <StatCard label="Total Tasks" value={data.tasks.total ?? 0} icon={TrendingUp} />
        <StatCard label="Overdue" value={data.tasks.overdue ?? 0} icon={AlertTriangle} tone={(data.tasks.overdue ?? 0) > 0 ? 'danger' : 'neutral'} />
        <StatCard label="Unassigned" value={data.tasks.unassigned ?? 0} icon={UserX} tone={(data.tasks.unassigned ?? 0) > 0 ? 'danger' : 'neutral'} />
      </div>

      {/* Task status + Activity */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <TaskStatusBar data={data.tasks} />

          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Flame className="h-4 w-4 text-gray-400" />
              Team Workload
            </h3>
            {workload.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No active assignments yet</p>
            ) : (
              <ul className="space-y-3">
                {workload.map(({ user: u, activeTaskCount }) => {
                  const max = workload[0].activeTaskCount || 1;
                  return (
                    <li key={u.id} className="flex items-center gap-3">
                      <Avatar name={u.fullName} src={u.avatarUrl} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-gray-700">{u.fullName}</span>
                      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-gray-900 transition-all duration-500" style={{ width: `${(activeTaskCount / max) * 100}%` }} />
                      </div>
                      <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-900">{activeTaskCount}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="card self-stretch p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Activity className="h-4 w-4 text-gray-400" />
              Recent Activity
            </h3>
          </div>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <ActivityFeed items={data.recentActivity} />
          </div>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Calendar className="h-4 w-4 text-gray-400" />
            Upcoming Deadlines
          </h3>
          <Link href="/tasks" className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-700">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {deadlines.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">Nothing due soon</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {deadlines.map((task) => (
              <li key={task.id}>
                <Link href={`/tasks/${task.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{task.name}</p>
                    <DueLabel date={task.plannedDueDate} />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    {task.assignees.length > 0 && <AvatarGroup users={task.assignees} max={2} />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Employee dashboard ────────────────────────────────────────────────────────

function EmployeeDashboardView() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'staff'],
    queryFn: () => dashboardApi.staff().then((r) => r.data.data as EmployeeDashboard),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const tasks = data.myTasks;
  const upcoming = data.upcomingTasks ?? [];

  return (
    <div className="space-y-6">
      <Greeting name={user?.fullName} />

      {/* My task stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'To Do',       value: tasks.todo,         color: 'text-gray-950' },
          { label: 'In Progress', value: tasks.inProgress,   color: 'text-sky-600' },
          { label: 'In Review',   value: tasks.review,       color: 'text-violet-600' },
          { label: 'Completed',   value: tasks.done,         color: 'text-emerald-600' },
          { label: 'Overdue',     value: tasks.overdue ?? 0, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card card-hover p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
            <p className={`mt-1.5 text-[26px] font-bold leading-none tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming tasks */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Calendar className="h-4 w-4 text-gray-400" />
            My Tasks
          </h3>
          <Link href="/my-tasks" className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-700">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No tasks assigned yet</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {upcoming.slice(0, 6).map((task) => (
              <li key={task.id}>
                <Link href={`/tasks/${task.id}`} className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{task.name}</p>
                    <DueLabel date={task.plannedDueDate} />
                  </div>
                  <TaskStatusBadge status={task.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Activity className="h-4 w-4 text-gray-400" />
          Recent Activity
        </h3>
        <div className="max-h-[360px] overflow-y-auto pr-1">
          <ActivityFeed items={data.recentActivity} />
        </div>
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
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
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
