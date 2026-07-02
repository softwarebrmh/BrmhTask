'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ListTodo, ChevronRight, Plus, X, ListTree, FilterX } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { TableRowsSkeleton } from '@/components/ui/skeleton';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useStaff } from '@/lib/hooks/use-staff';
import { companyApi, tasksApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { TaskStatus, TaskPriority, TaskTreeNode } from '@/types';

const STATUS_OPTIONS: { label: string; value: TaskStatus | '' }[] = [
  { label: 'All statuses', value: '' },
  { label: 'To Do',        value: 'todo' },
  { label: 'In Progress',  value: 'in_progress' },
  { label: 'In Review',    value: 'review' },
  { label: 'Completed',    value: 'completed' },
];

const PRIORITY_OPTIONS: { label: string; value: TaskPriority | '' }[] = [
  { label: 'All priorities', value: '' },
  { label: 'Critical',       value: 'critical' },
  { label: 'High',           value: 'high' },
  { label: 'Medium',         value: 'medium' },
  { label: 'Low',            value: 'low' },
];

function NewTaskModal({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium', plannedDueDate: '' });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const { data: staffData } = useStaff(companyId);
  const employees = (staffData?.data ?? []).filter((s: any) => s.user);

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((ids) => (ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]));
  };

  const mutation = useMutation({
    mutationFn: () => companyApi.createTask(companyId, {
      name: form.name,
      description: form.description || undefined,
      priority: form.priority,
      plannedDueDate: form.plannedDueDate || undefined,
      assigneeIds: assigneeIds.length ? assigneeIds : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-tasks'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">New Task</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Task name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Design login screen"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Brief description…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Due date</label>
              <input type="date" value={form.plannedDueDate} onChange={(e) => setForm((f) => ({ ...f, plannedDueDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assignees <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {employees.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">No active employees</p>
              ) : (
                employees.map((e: any) => (
                  <label key={e.user.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(e.user.id)}
                      onChange={() => toggleAssignee(e.user.id)}
                      className="rounded border-gray-300"
                    />
                    {e.user.fullName}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name.trim() || mutation.isPending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable subtask tree row ───────────────────────────────────────────────

function SubtreeRow({ node, depth }: { node: TaskTreeNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <tr className="group bg-gray-50/40 hover:bg-gray-50 transition-colors">
        <td className="px-4 py-2.5 max-w-xs">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setOpen(!open)}
                className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="inline-block h-3.5 w-3.5 shrink-0" />
            )}
            <span className="text-gray-300 shrink-0">└</span>
            <Link href={`/tasks/${node.id}`} className="flex items-center gap-1.5 truncate">
              <span className="font-mono text-xs text-gray-400 shrink-0">{node.displayId}</span>
              <span className="text-sm text-gray-700 hover:underline truncate">{node.name}</span>
              {hasChildren && (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-500 shrink-0">
                  <ListTree className="h-3 w-3" /> {node.children.length}
                </span>
              )}
            </Link>
          </div>
        </td>
        <td className="px-4 py-2.5"><TaskStatusBadge status={node.status} /></td>
        <td className="px-4 py-2.5 hidden lg:table-cell"><PriorityBadge priority={node.priority} /></td>
        <td className="px-4 py-2.5 hidden lg:table-cell">
          {node.assignees.length > 0 ? (
            <AvatarGroup users={node.assignees} max={3} />
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-400 hidden xl:table-cell">
          {node.plannedDueDate ? formatDate(node.plannedDueDate) : '—'}
        </td>
        <td className="px-4 py-2.5 hidden xl:table-cell" />
        <td className="px-4 py-2.5">
          <Link
            href={`/tasks/${node.id}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </td>
      </tr>
      {open && node.children.map((child) => (
        <SubtreeRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

function TaskRow({ task }: { task: any }) {
  const [open, setOpen] = useState(false);
  const hasChildren = task.subTaskCount > 0;

  const { data: tree } = useQuery({
    queryKey: ['task-tree', task.id],
    queryFn: () => tasksApi.getTree(task.id).then((r) => r.data.data),
    enabled: open && hasChildren,
  });

  return (
    <>
      <tr className="group hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 max-w-xs">
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                onClick={() => setOpen(!open)}
                className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="inline-block h-3.5 w-3.5 shrink-0" />
            )}
            <Link href={`/tasks/${task.id}`} className="flex items-center gap-1.5 truncate">
              <span className="font-mono text-xs text-gray-400 shrink-0">{task.displayId}</span>
              <span className="font-medium text-gray-900 hover:underline truncate">{task.name}</span>
              {hasChildren && (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500 shrink-0">
                  <ListTree className="h-3 w-3" /> {task.subTaskCount}
                </span>
              )}
            </Link>
          </div>
        </td>
        <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><PriorityBadge priority={task.priority} /></td>
        <td className="px-4 py-3 hidden lg:table-cell">
          {task.assignees?.length > 0 ? (
            <AvatarGroup users={task.assignees} max={3} />
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 hidden xl:table-cell">
          {task.plannedDueDate ? formatDate(task.plannedDueDate) : '—'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 hidden xl:table-cell">
          {formatDate(task.createdAt)}
        </td>
        <td className="px-4 py-3">
          <Link
            href={`/tasks/${task.id}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </td>
      </tr>
      {open && tree?.tree.children.map((child) => (
        <SubtreeRow key={child.id} node={child} depth={1} />
      ))}
    </>
  );
}

export default function AllTasksPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? '';
  const searchParams = useSearchParams();

  const [status,     setStatus]     = useState<TaskStatus | ''>('');
  const [priority,   setPriority]   = useState<TaskPriority | ''>('');
  const [search,     setSearch]     = useState('');
  const [assigneeId, setAssigneeId] = useState(searchParams.get('assigneeId') ?? '');
  const [showModal,  setShowModal]  = useState(false);

  const { data: staffData } = useStaff(companyId);
  const employees = (staffData?.data ?? []).filter((s: any) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['company-tasks', companyId, status, priority, search, assigneeId],
    queryFn: () =>
      companyApi.allTasks(companyId, {
        status:     status     || undefined,
        priority:   priority   || undefined,
        search:     search     || undefined,
        assigneeId: assigneeId || undefined,
        limit: 100,
      }).then((r: any) => r.data),
    enabled: !!companyId,
  });

  const tasks: any[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;
  const filteredEmployee = employees.find((e: any) => e.user?.id === assigneeId)?.user;
  const hasActiveFilters = Boolean(status || priority || search || assigneeId);

  const clearFilters = () => {
    setStatus('');
    setPriority('');
    setSearch('');
    setAssigneeId('');
  };

  const selectClasses =
    'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10';

  return (
    <>
      {showModal && <NewTaskModal companyId={companyId} onClose={() => setShowModal(false)} />}
      <Header title="All Tasks" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | '')} className={selectClasses}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | '')} className={selectClasses}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={selectClasses}>
              <option value="">All employees</option>
              {employees.map((e: any) => (
                <option key={e.user.id} value={e.user.id}>{e.user.fullName}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <FilterX className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(15,23,42,0.24)] transition-colors hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" /> New Task
            </button>
          </div>

          {filteredEmployee && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1.5 pr-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Avatar name={filteredEmployee.fullName} src={filteredEmployee.avatarUrl} size="xs" />
                <span className="text-[13px] text-gray-700">Tasks for <strong>{filteredEmployee.fullName}</strong></span>
                <button onClick={() => setAssigneeId('')} className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Tasks</h2>
              <span className="text-xs font-medium tabular-nums text-gray-400">
                {isLoading ? 'Loading…' : `${total} task${total !== 1 ? 's' : ''}`}
              </span>
            </div>

            {!isLoading && tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                  <ListTodo className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
                </p>
                <p className="mt-1 text-[13px] text-gray-400">
                  {hasActiveFilters ? 'Try adjusting or clearing the filters.' : 'Create your first task to get the team moving.'}
                </p>
                <button
                  onClick={hasActiveFilters ? clearFilters : () => setShowModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-gray-50"
                >
                  {hasActiveFilters ? (<><FilterX className="h-4 w-4" /> Clear filters</>) : (<><Plus className="h-4 w-4" /> New Task</>)}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Task</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:table-cell">Priority</th>
                      <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:table-cell">Assignees</th>
                      <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 xl:table-cell">Due date</th>
                      <th className="hidden px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 xl:table-cell">Created</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading
                      ? <TableRowsSkeleton rows={8} cols={7} />
                      : tasks.map((task) => <TaskRow key={task.id} task={task} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
