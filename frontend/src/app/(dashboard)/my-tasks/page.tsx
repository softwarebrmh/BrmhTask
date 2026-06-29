'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CheckSquare, Clock, AlertCircle, Search, Filter,
  ArrowRight, Calendar, Flag, List, LayoutGrid,
  CalendarDays, ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { TaskStatus, TaskPriority, Task } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

type TabId = 'todo' | 'in_progress' | 'review' | 'done' | 'overdue';
type ViewMode = 'list' | 'board' | 'calendar';

const TABS: { id: TabId; label: string; icon: any; status?: TaskStatus }[] = [
  { id: 'todo',        label: 'Assigned',    icon: CheckSquare, status: 'todo' },
  { id: 'in_progress', label: 'In Progress', icon: Clock,       status: 'in_progress' },
  { id: 'review',      label: 'Review',      icon: Filter,      status: 'review' },
  { id: 'done',        label: 'Completed',   icon: CheckSquare, status: 'done' },
  { id: 'overdue',     label: 'Overdue',     icon: AlertCircle },
];

const BOARD_COLUMNS: { status: TaskStatus; label: string; color: string; dot: string }[] = [
  { status: 'todo',        label: 'To Do',       color: 'bg-gray-50 border-gray-200',    dot: 'bg-gray-400' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500' },
  { status: 'review',      label: 'Review',      color: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  { status: 'done',        label: 'Done',        color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
];

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-gray-300', medium: 'bg-blue-400', high: 'bg-amber-400', critical: 'bg-red-500',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ─── List view ─────────────────────────────────────────────────────────────────

function ListView({ tasks, activeTab, isLoading }: { tasks: Task[]; activeTab: TabId; isLoading: boolean }) {
  const emptyMessages: Record<TabId, string> = {
    todo:        'No tasks assigned to you',
    in_progress: 'No tasks in progress',
    review:      'No tasks pending review',
    done:        'No completed tasks yet',
    overdue:     'No overdue tasks — great job!',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 rounded-xl border border-gray-100 bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Task</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 hidden md:table-cell">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 hidden sm:table-cell">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 hidden lg:table-cell">Assignees</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 hidden md:table-cell">Due Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckSquare className="h-8 w-8 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">{emptyMessages[activeTab]}</p>
                </div>
              </td>
            </tr>
          ) : (
            tasks.map((task) => <ListRow key={task.id} task={task} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function ListRow({ task }: { task: Task }) {
  const isOverdue = task.plannedDueDate && task.status !== 'done' && new Date(task.plannedDueDate) < new Date();
  return (
    <tr className="group hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/tasks/${task.id}`} className="block">
          <p className="font-medium text-gray-900 group-hover:text-black text-sm">{task.name}</p>
          {task.description && (
            <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{task.description}</p>
          )}
        </Link>
      </td>
      <td className="px-4 py-3 hidden md:table-cell"><TaskStatusBadge status={task.status} /></td>
      <td className="px-4 py-3 hidden sm:table-cell"><PriorityBadge priority={task.priority} /></td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {task.assignees.length > 0 ? (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar key={a.id} name={a.fullName} src={a.avatarUrl} size="xs" className="ring-2 ring-white" />
            ))}
            {task.assignees.length > 3 && (
              <div className="h-5 w-5 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center">
                <span className="text-xs text-gray-600">+{task.assignees.length - 3}</span>
              </div>
            )}
          </div>
        ) : <span className="text-xs text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {task.plannedDueDate ? (
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            {formatDate(task.plannedDueDate)}{isOverdue && ' (overdue)'}
          </span>
        ) : <span className="text-xs text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/tasks/${task.id}`}
          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all"
        >
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  );
}

// ─── Board view ────────────────────────────────────────────────────────────────

function BoardView({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {BOARD_COLUMNS.map(({ status, label, color, dot }) => {
        const col = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className={`rounded-xl border ${color} p-3 min-h-[200px]`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-2 w-2 rounded-full ${dot}`} />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</span>
              <span className="ml-auto text-xs font-medium text-gray-400">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.length === 0 && (
                <p className="text-center text-xs text-gray-300 py-6">No tasks</p>
              )}
              {col.map((task) => <BoardCard key={task.id} task={task} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BoardCard({ task }: { task: Task }) {
  const isOverdue = task.plannedDueDate && task.status !== 'done' && new Date(task.plannedDueDate) < new Date();
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-lg border border-white bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{task.name}</p>
        <div className={`h-2 w-2 shrink-0 mt-1 rounded-full ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
      </div>
      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2 mt-2">
        {task.plannedDueDate ? (
          <div className="flex items-center gap-1">
            <Calendar className={`h-3 w-3 ${isOverdue ? 'text-red-400' : 'text-gray-300'}`} />
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {formatDate(task.plannedDueDate)}
            </span>
          </div>
        ) : <div />}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 2).map((a) => (
              <Avatar key={a.id} name={a.fullName} src={a.avatarUrl} size="xs" className="ring-1 ring-white" />
            ))}
          </div>
        )}
      </div>
      {task.stepProgress.total > 0 && (
        <div className="mt-2.5">
          <div className="h-1 rounded-full bg-gray-100">
            <div
              className="h-1 rounded-full bg-gray-900 transition-all"
              style={{ width: `${task.stepProgress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

// ─── Calendar view ─────────────────────────────────────────────────────────────

function CalendarView({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last  = new Date(viewYear, viewMonth + 1, 0);
    const startPad = first.getDay();
    const days: (Date | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewYear, viewMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.plannedDueDate) continue;
      const key = t.plannedDueDate.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 rounded-xl border border-gray-100 bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
        {calendarDays.map((day, i) => {
          if (!day) {
            return <div key={`pad-${i}`} className="min-h-[80px] bg-gray-50/50" />;
          }
          const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
          const dayTasks = tasksByDate[key] ?? [];
          const isToday = key === todayKey;
          const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <div key={key} className={`min-h-[80px] p-1.5 ${isPast && !isToday ? 'bg-gray-50/30' : ''}`}>
              <div className={`mb-1 h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                isToday ? 'bg-gray-900 text-white' : isPast ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    title={t.name}
                    className={`block truncate rounded px-1.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-75 ${
                      t.status === 'done'
                        ? 'bg-emerald-50 text-emerald-700'
                        : isPast
                        ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {t.name}
                  </Link>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-xs text-gray-400 pl-1">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <span className="text-xs text-gray-400">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded bg-blue-100 border border-blue-200" />
          <span className="text-xs text-gray-400">Upcoming</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded bg-red-100 border border-red-200" />
          <span className="text-xs text-gray-400">Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded bg-emerald-100 border border-emerald-200" />
          <span className="text-xs text-gray-400">Done</span>
        </div>
      </div>
    </div>
  );
}

// ─── View toggle ───────────────────────────────────────────────────────────────

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const views: { id: ViewMode; icon: any; label: string }[] = [
    { id: 'list',     icon: List,        label: 'List' },
    { id: 'board',    icon: LayoutGrid,  label: 'Board' },
    { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  ];
  return (
    <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5">
      {views.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={label}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            view === id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('todo');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');

  const statusParam = TABS.find((t) => t.id === activeTab)?.status;

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', activeTab, search, priority],
    queryFn: () =>
      usersApi.tasks({
        status: activeTab === 'overdue' ? undefined : statusParam,
        priority: priority || undefined,
        search: search || undefined,
        limit: 100,
      }).then((r) => r.data),
    enabled: !!user,
  });

  const allTasks: Task[] = data?.data ?? [];

  const tasks = useMemo(() => {
    if (activeTab === 'overdue') {
      return allTasks.filter(
        (t) => t.plannedDueDate && t.status !== 'done' && new Date(t.plannedDueDate) < new Date(),
      );
    }
    return allTasks;
  }, [allTasks, activeTab]);

  const calendarTasks = useMemo(() => {
    if (viewMode !== 'calendar') return [];
    return (data?.data ?? []).filter((t) => !!t.plannedDueDate);
  }, [viewMode, data]);

  return (
    <>
      <Header
        title={
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-gray-900">My Tasks</span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl space-y-4">

          {/* Greeting */}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <p className="text-base font-semibold text-gray-900">
              {getGreeting()}, {user?.fullName?.split(' ')[0]}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Here are all your tasks across sprints and projects.
            </p>
          </div>

          {/* Tabs + view toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1 flex-1 min-w-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {id === 'overdue' && activeTab !== 'overdue' && (
                    <span className="ml-0.5 rounded-full bg-red-100 text-red-600 text-xs px-1.5 py-0.5 font-semibold leading-none">!</span>
                  )}
                </button>
              ))}
            </div>
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>

          {/* Filter row — hidden for calendar */}
          {viewMode !== 'calendar' && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
                  className="h-9 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              {(search || priority) && (
                <button
                  onClick={() => { setSearch(''); setPriority(''); }}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Views */}
          {viewMode === 'list' && (
            <ListView tasks={tasks} activeTab={activeTab} isLoading={isLoading} />
          )}
          {viewMode === 'board' && (
            <BoardView tasks={viewMode === 'board' ? allTasks : tasks} isLoading={isLoading} />
          )}
          {viewMode === 'calendar' && (
            <CalendarView tasks={calendarTasks} isLoading={isLoading} />
          )}

          {viewMode !== 'calendar' && tasks.length > 0 && (
            <p className="text-center text-xs text-gray-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </main>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
