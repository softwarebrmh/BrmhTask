'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock, Calendar, User, CheckSquare, Paperclip, FileText,
  MessageSquare, Plus, Check, Trash2, Upload, ChevronRight,
  Edit2, X, AlertTriangle, Activity, History, UserPlus,
  Search, TrendingUp, ArrowRight, Flag,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageSpinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useTaskDetail } from '@/lib/hooks/use-tasks';
import { stepsApi, attachmentsApi, notesApi, commentsApi, tasksApi, staffApi, auditApi } from '@/lib/api';
import { taskKeys } from '@/lib/hooks/use-tasks';
import { formatDate, formatDateTime, formatFileSize, timeAgo, extractError } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { TaskStatus, TaskPriority } from '@/types';

// ─── Valid transitions ─────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo:        ['in_progress'],
  in_progress: ['review', 'todo'],
  review:      ['done', 'in_progress'],
  done:        ['review'],
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
};

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, action, children, defaultOpen = true }: {
  title: string; icon: any; action?: React.ReactNode;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {action}
          <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-4">{children}</div>}
    </div>
  );
}

// ─── Steps section ─────────────────────────────────────────────────────────────

function StepsSection({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: steps = [] } = useQuery({
    queryKey: ['steps', taskId],
    queryFn: () => stepsApi.list(taskId).then((r) => r.data.data),
  });

  const toggle = useMutation({
    mutationFn: ({ stepId, isChecked }: { stepId: string; isChecked: boolean }) =>
      isChecked ? stepsApi.uncheck(taskId, stepId) : stepsApi.check(taskId, stepId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps', taskId] });
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const add = useMutation({
    mutationFn: (title: string) => stepsApi.create(taskId, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps', taskId] });
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      setNewTitle('');
      setAdding(false);
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (stepId: string) => stepsApi.delete(taskId, stepId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps', taskId] });
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const done = steps.filter((s) => s.isChecked).length;
  const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

  return (
    <Section
      title={`Steps${steps.length > 0 ? ` (${done}/${steps.length})` : ''}`}
      icon={CheckSquare}
      action={
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add step
        </button>
      }
    >
      {steps.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>{pct}% complete</span>
            <span>{done} of {steps.length} done</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div
              className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gray-900'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        {steps.map((step) => (
          <div key={step.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-gray-50">
            <button
              onClick={() => toggle.mutate({ stepId: step.id, isChecked: step.isChecked })}
              className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                step.isChecked
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {step.isChecked && <Check className="h-3 w-3" />}
            </button>
            <span className={`flex-1 text-sm ${step.isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {step.title}
            </span>
            {step.isChecked && step.checkedBy && (
              <span className="hidden group-hover:inline text-xs text-gray-400">
                by {step.checkedBy.fullName}
              </span>
            )}
            <button
              onClick={() => del.mutate(step.id)}
              className="hidden group-hover:flex text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {(adding || steps.length === 0) && (
        <div className="mt-3 flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Step title…"
            autoFocus={adding}
            className="h-8 flex-1 rounded-md border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTitle.trim()) add.mutate(newTitle.trim());
              if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
            }}
          />
          <Button
            size="sm"
            onClick={() => newTitle.trim() && add.mutate(newTitle.trim())}
            disabled={!newTitle.trim() || add.isPending}
            loading={add.isPending}
          >
            Add
          </Button>
          {adding && (
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(''); }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {steps.length === 0 && !adding && (
        <p className="py-2 text-sm text-gray-400">No steps yet. Steps help track granular progress.</p>
      )}
    </Section>
  );
}

// ─── Effort section ────────────────────────────────────────────────────────────

function EffortSection({ task, isAdmin }: { task: any; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [logging, setLogging] = useState(false);
  const [form, setForm] = useState({ actual: '', estimated: '' });

  const logHours = useMutation({
    mutationFn: () =>
      tasksApi.updateEffort(task.id, {
        actualEffortPh: form.actual ? parseFloat(form.actual) : undefined,
        estimatedEffortPh: form.estimated ? parseFloat(form.estimated) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      setLogging(false);
      setForm({ actual: '', estimated: '' });
      toast.success('Effort updated');
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const planned   = Number(task.plannedEffortPh ?? 0);
  const estimated = Number(task.estimatedEffortPh ?? 0);
  const actual    = Number(task.actualEffortPh ?? 0);
  const remaining = Math.max(0, estimated - actual);
  const slippage  = Number(task.slippagePh ?? 0);

  const metrics = [
    { label: 'Planned',   value: planned,   unit: 'h', color: 'text-gray-900' },
    { label: 'Estimated', value: estimated, unit: 'h', color: 'text-blue-700' },
    { label: 'Actual',    value: actual,    unit: 'h', color: actual > planned ? 'text-red-600' : 'text-gray-900' },
    { label: 'Remaining', value: remaining, unit: 'h', color: remaining === 0 ? 'text-emerald-600' : 'text-gray-900' },
  ];

  return (
    <Section
      title="Effort Tracking"
      icon={TrendingUp}
      action={
        isAdmin && !logging ? (
          <button
            onClick={() => { setLogging(true); setForm({ actual: String(actual), estimated: String(estimated) }); }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" /> Log hours
          </button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}<span className="text-sm font-normal ml-0.5">{unit}</span></p>
          </div>
        ))}
      </div>

      {slippage !== 0 && (
        <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
          slippage > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {slippage > 0
              ? `${slippage}h over planned — review timeline with your team`
              : `${Math.abs(slippage)}h under planned — great execution`}
          </span>
        </div>
      )}

      {logging && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Update effort hours</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Actual hours</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.actual}
                onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))}
                className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estimated hours</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={form.estimated}
                onChange={(e) => setForm((f) => ({ ...f, estimated: e.target.value }))}
                className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setLogging(false)}>Cancel</Button>
            <Button size="sm" onClick={() => logHours.mutate()} loading={logHours.isPending}>Save</Button>
          </div>
        </div>
      )}
    </Section>
  );
}

// ─── Attachments section ───────────────────────────────────────────────────────

function AttachmentsSection({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => attachmentsApi.list(taskId).then((r) => r.data.data),
  });

  const upload = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskId, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attachments', taskId] }); toast.success('File uploaded'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => attachmentsApi.delete(taskId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attachments', taskId] }); toast.success('Deleted'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return '🖼️';
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '📊';
    if (mime.includes('word') || mime.includes('document')) return '📝';
    if (mime.includes('zip') || mime.includes('compressed')) return '🗜️';
    if (mime.startsWith('video/')) return '🎥';
    if (mime.startsWith('audio/')) return '🎵';
    return '📎';
  };

  return (
    <Section
      title={`Attachments${attachments.length > 0 ? ` (${attachments.length})` : ''}`}
      icon={Paperclip}
      action={
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])}
          />
        </>
      }
    >
      {attachments.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <Upload className="h-6 w-6 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Drop files here or click to upload</p>
          <p className="text-xs text-gray-300 mt-1">Max 10 MB per file</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50 space-y-0">
          {attachments.map((a) => (
            <li key={a.id} className="group flex items-center gap-3 py-2.5">
              <span className="text-lg shrink-0">{getFileIcon(a.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={attachmentsApi.downloadUrl(taskId, a.id)}
                  className="block truncate text-sm font-medium text-gray-800 hover:text-gray-950 hover:underline"
                  download
                >
                  {a.fileName}
                </a>
                <p className="text-xs text-gray-400">
                  {formatFileSize(a.fileSize)} · {a.uploader.fullName} · {timeAgo(a.createdAt)}
                </p>
              </div>
              <div className="hidden group-hover:flex items-center gap-1">
                <a
                  href={attachmentsApi.downloadUrl(taskId, a.id)}
                  download
                  className="rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  title="Download"
                >
                  <Upload className="h-3.5 w-3.5 rotate-180" />
                </a>
                <button
                  onClick={() => del.mutate(a.id)}
                  className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ─── Notes section ─────────────────────────────────────────────────────────────

function NotesSection({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  const { data } = useQuery({
    queryKey: ['notes', taskId],
    queryFn: () => notesApi.list(taskId).then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => notesApi.create(taskId, { title: form.title || undefined, content: form.content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', taskId] });
      setCreating(false);
      setForm({ title: '', content: '' });
      toast.success('Note added');
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const update = useMutation({
    mutationFn: (noteId: string) =>
      notesApi.update(taskId, noteId, { title: editForm.title || undefined, content: editForm.content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', taskId] });
      setEditingId(null);
      toast.success('Note updated');
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(taskId, noteId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', taskId] }); toast.success('Note deleted'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const notes = data?.data ?? [];

  return (
    <Section
      title={`Notes${notes.length > 0 ? ` (${notes.length})` : ''}`}
      icon={FileText}
      action={
        !creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add note
          </button>
        )
      }
    >
      {creating && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)"
            className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Write your note…"
            rows={4}
            className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setForm({ title: '', content: '' }); }}>Cancel</Button>
            <Button size="sm" onClick={() => form.content.trim() && create.mutate()} loading={create.isPending} disabled={!form.content.trim()}>
              Save note
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="group rounded-lg border border-gray-100 bg-white p-4">
            {editingId === note.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Title (optional)"
                  className="h-8 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none"
                />
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => update.mutate(note.id)} loading={update.isPending}>Update</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    {note.title && <p className="text-sm font-semibold text-gray-900 mb-1">{note.title}</p>}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingId(note.id); setEditForm({ title: note.title ?? '', content: note.content }); }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => del.mutate(note.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Avatar name={note.author.fullName} size="xs" />
                  <span>{note.author.fullName}</span>
                  <span>·</span>
                  <span>{timeAgo(note.updatedAt)}</span>
                  {(note as any).version > 1 && <span className="text-gray-300">· v{(note as any).version}</span>}
                </div>
              </>
            )}
          </div>
        ))}
        {notes.length === 0 && !creating && (
          <p className="py-2 text-sm text-gray-400">No notes yet. Notes are private to your team.</p>
        )}
      </div>
    </Section>
  );
}

// ─── Comments section ──────────────────────────────────────────────────────────

function CommentsSection({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.list(taskId, { limit: 50 }).then((r) => r.data),
  });

  const post = useMutation({
    mutationFn: (content: string) => commentsApi.create(taskId, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', taskId] }); setText(''); },
    onError: (e) => toast.error(extractError(e)),
  });

  const postReply = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsApi.createReply(taskId, commentId, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      setReplyingTo(null);
      setReplyText('');
    },
    onError: (e) => toast.error(extractError(e)),
  });

  const react = useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) =>
      commentsApi.react(taskId, commentId, emoji),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  });

  const EMOJI_QUICK = ['👍', '❤️', '😄', '🎉', '👀'];
  const comments = data?.data ?? [];

  return (
    <Section
      title={`Comments${data?.meta?.total ? ` (${data.meta.total})` : ''}`}
      icon={MessageSquare}
    >
      <div className="space-y-5">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            {c.author && <Avatar name={c.author.fullName} size="sm" className="shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-gray-800">{c.author?.fullName ?? '[deleted]'}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
              </div>

              <div className="flex items-center gap-3 mt-2 px-1">
                <div className="flex gap-1">
                  {EMOJI_QUICK.map((e) => {
                    const count = c.reactions.filter((r) => r.emoji === e).length;
                    return (
                      <button
                        key={e}
                        onClick={() => react.mutate({ commentId: c.id, emoji: e })}
                        className={`rounded-full px-1.5 py-0.5 text-xs border transition-colors ${
                          count > 0
                            ? 'border-blue-200 bg-blue-50 text-gray-800'
                            : 'border-transparent hover:border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {e}{count > 0 && ` ${count}`}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setReplyingTo(c.id); setReplyText(''); }}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
                >
                  Reply
                </button>
              </div>

              {c.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex gap-2">
                      {r.author && <Avatar name={r.author.fullName} size="xs" className="shrink-0 mt-0.5" />}
                      <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700 mr-1.5">{r.author?.fullName}</span>
                        <span className="text-xs text-gray-600">{r.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === c.id && (
                <div className="mt-2 flex gap-2 pl-4">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    autoFocus
                    className="h-8 flex-1 rounded-md border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && replyText.trim())
                        postReply.mutate({ commentId: c.id, content: replyText.trim() });
                      if (e.key === 'Escape') setReplyingTo(null);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => replyText.trim() && postReply.mutate({ commentId: c.id, content: replyText.trim() })}
                    loading={postReply.isPending}
                    disabled={!replyText.trim()}
                  >
                    Reply
                  </Button>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="py-2 text-sm text-gray-400">No comments yet. Start the conversation.</p>
        )}

        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment… (Ctrl+Enter to post)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey && text.trim()) post.mutate(text.trim());
            }}
          />
          <Button
            size="sm"
            onClick={() => text.trim() && post.mutate(text.trim())}
            disabled={!text.trim()}
            loading={post.isPending}
          >
            Post
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ─── Assignment history ────────────────────────────────────────────────────────

function AssignmentHistory({ taskId }: { taskId: string }) {
  const { data: history = [] } = useQuery({
    queryKey: ['assignee-history', taskId],
    queryFn: () => tasksApi.getAssigneeHistory(taskId).then((r) => r.data.data ?? []),
  });

  if (history.length === 0) return null;

  return (
    <Section title="Assignment History" icon={History} defaultOpen={false}>
      <ul className="space-y-3">
        {history.map((entry: any) => (
          <li key={entry.id} className="flex items-start gap-3">
            <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${entry.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{entry.user?.fullName ?? '—'}</span>
                <span className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${
                  entry.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {entry.isActive ? 'Active' : 'Removed'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Assigned by {entry.assignedByUser?.fullName ?? '—'} · {timeAgo(entry.assignedAt)}
                {entry.unassignedAt && ` · Removed ${timeAgo(entry.unassignedAt)}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ─── Audit timeline ────────────────────────────────────────────────────────────

function AuditTimeline({ taskId }: { taskId: string }) {
  const { data } = useQuery({
    queryKey: ['task-audit', taskId],
    queryFn: () => auditApi.taskAudit(taskId, { limit: 20 }).then((r) => r.data),
  });

  const items: any[] = data?.data ?? [];
  if (items.length === 0) return null;

  const actionLabel = (action: string) => action.replace(/_/g, ' ').toLowerCase();

  return (
    <Section title="Activity" icon={Activity} defaultOpen={false}>
      <ul className="space-y-0 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-2 relative">
            <div className="h-5 w-5 shrink-0 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs text-gray-700">
                <span className="font-medium">{item.actorName ?? 'System'}</span>
                {' '}
                <span className="text-gray-500">{actionLabel(item.action)}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ─── Assignee picker (admin) ───────────────────────────────────────────────────

function AssigneePicker({ task, companyId }: { task: any; companyId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: staffData } = useQuery({
    queryKey: ['staff', companyId],
    queryFn: () => staffApi.list(companyId, { status: 'active' }).then((r) => r.data),
    enabled: open && !!companyId,
  });

  const assign = useMutation({
    mutationFn: (ids: string[]) => tasksApi.assign(task.id, ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: taskKeys.detail(task.id) }); toast.success('Assignees updated'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const unassign = useMutation({
    mutationFn: (userId: string) => tasksApi.unassign(task.id, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: taskKeys.detail(task.id) }); toast.success('Removed'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const activeAssigneeIds = new Set<string>(task.assignees.map((a: any) => String(a.id)));

  const staffList = (staffData?.data ?? []).filter(
    (s: any) => s.user && s.user.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleMember = (userId: string) => {
    if (activeAssigneeIds.has(userId)) {
      unassign.mutate(userId);
    } else {
      const newIds = [...Array.from(activeAssigneeIds), userId];
      assign.mutate(newIds);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {task.assignees.map((a: any) => (
          <div key={a.id} className="group flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-1 pr-2">
            <Avatar name={a.fullName} src={a.avatarUrl} size="xs" />
            <span className="text-xs text-gray-700 font-medium">{a.fullName}</span>
            <button
              onClick={() => unassign.mutate(a.id)}
              className="hidden group-hover:flex text-gray-300 hover:text-red-500 transition-colors ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors w-full"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add assignee
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-2 border-b border-gray-100">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees…"
              className="flex-1 text-sm outline-none"
            />
            <button onClick={() => { setOpen(false); setSearch(''); }}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <ul className="max-h-40 overflow-y-auto">
            {staffList.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400 text-center">No active employees found</li>
            )}
            {staffList.map((s: any) => {
              const isAssigned = activeAssigneeIds.has(s.user?.id);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => s.user && toggleMember(s.user.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar name={s.user?.fullName ?? s.email} size="xs" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium text-gray-800 truncate">{s.user?.fullName ?? s.email}</p>
                      {s.designation && <p className="text-xs text-gray-400 truncate">{s.designation}</p>}
                    </div>
                    {isAssigned && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Properties sidebar ────────────────────────────────────────────────────────

function PropertiesSidebar({ task, isAdmin, companyId }: { task: any; isAdmin: boolean; companyId: string }) {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: (s: TaskStatus) => tasksApi.updateStatus(task.id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: taskKeys.detail(task.id) }); toast.success('Status updated'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const updateTask = useMutation({
    mutationFn: (data: { priority?: TaskPriority }) => tasksApi.update(task.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: taskKeys.detail(task.id) }); toast.success('Updated'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const isOverdue = task.plannedDueDate && task.status !== 'done' && new Date(task.plannedDueDate) < new Date();

  const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
  const PRIORITY_COLORS: Record<TaskPriority, string> = {
    low: 'text-gray-500', medium: 'text-blue-600', high: 'text-amber-600', critical: 'text-red-600',
  };

  return (
    <div className="space-y-3 lg:sticky lg:top-6">
      {/* Status */}
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Status</p>
        <TaskStatusBadge status={task.status} />
        <div className="mt-3 flex flex-col gap-1.5">
          {(VALID_TRANSITIONS[task.status as TaskStatus] ?? []).map((s) => (
            <button
              key={s}
              onClick={() => updateStatus.mutate(s)}
              disabled={updateStatus.isPending}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <span>Move to {STATUS_LABELS[s]}</span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Priority</p>
        {isAdmin ? (
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => task.priority !== p && updateTask.mutate({ priority: p })}
                className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors capitalize ${
                  task.priority === p
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : `border-gray-200 bg-white ${PRIORITY_COLORS[p]} hover:border-gray-300 hover:bg-gray-50`
                }`}
              >
                <Flag className="h-3 w-3" />
                {p}
              </button>
            ))}
          </div>
        ) : (
          <PriorityBadge priority={task.priority} />
        )}
      </div>

      {/* Assignees */}
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Assignees
        </p>
        {isAdmin ? (
          <AssigneePicker task={task} companyId={companyId} />
        ) : task.assignees.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {task.assignees.map((a: any) => (
              <div key={a.id} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-1 pr-2">
                <Avatar name={a.fullName} src={a.avatarUrl} size="xs" />
                <span className="text-xs text-gray-700 font-medium">{a.fullName}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Unassigned</p>
        )}
      </div>

      {/* Details */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Details</p>

        {task.plannedDueDate && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Due date
            </span>
            <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(task.plannedDueDate)}
              {isOverdue && <span className="ml-1 text-red-400">(overdue)</span>}
            </span>
          </div>
        )}

        {task.owner && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Owner</span>
            <div className="flex items-center gap-1.5">
              <Avatar name={task.owner.fullName} size="xs" />
              <span className="font-medium text-gray-800">{task.owner.fullName}</span>
            </div>
          </div>
        )}

        {task.stepProgress?.total > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1"><CheckSquare className="h-3.5 w-3.5" /> Steps</span>
              <span className="font-medium">{task.stepProgress.percentage}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <div
                className={`h-1.5 rounded-full transition-all ${task.stepProgress.percentage === 100 ? 'bg-emerald-500' : 'bg-gray-900'}`}
                style={{ width: `${task.stepProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Planned
          </span>
          <span className="font-medium text-gray-900">{task.plannedEffortPh}h</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Actual</span>
          <span className={`font-medium ${Number(task.slippagePh) > 0 ? 'text-red-600' : Number(task.slippagePh) < 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
            {task.actualEffortPh}h
            {Number(task.slippagePh) !== 0 && (
              <span className="ml-1 opacity-60">({Number(task.slippagePh) > 0 ? '+' : ''}{task.slippagePh}h)</span>
            )}
          </span>
        </div>
      </div>

      {/* Sprint */}
      {task.sprint && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Sprint</p>
          <Link
            href={`/projects/${task.sprint.projectId}/sprints/${task.sprint.id}`}
            className="text-sm font-medium text-gray-900 hover:text-gray-600 hover:underline"
          >
            {task.sprint.name}
          </Link>
          {task.sprint.goal && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.sprint.goal}</p>
          )}
          {task.sprint.startDate && (
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(task.sprint.startDate)} → {formatDate(task.sprint.endDate)}
            </p>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="space-y-1 px-1">
        <p className="text-xs text-gray-400">Created {formatDateTime(task.createdAt)}</p>
        <p className="text-xs text-gray-400">Updated {formatDateTime(task.updatedAt)}</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TaskWorkspacePage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const companyId = user?.companyId ?? '';

  const { data: task, isLoading } = useTaskDetail(taskId);

  if (isLoading) return <PageSpinner />;
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-sm">Task not found</p>
        <Link href="/projects" className="mt-2 text-sm font-medium text-gray-700 hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <>
      <Header
        title={
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            {task.sprint && (
              <>
                <Link href={`/projects/${task.sprint.projectId}`} className="shrink-0 text-gray-400 hover:text-gray-700">Project</Link>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                <Link
                  href={`/projects/${task.sprint.projectId}/sprints/${task.sprint.id}`}
                  className="max-w-[120px] truncate text-gray-400 hover:text-gray-700"
                >
                  {task.sprint.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
              </>
            )}
            <span className="font-semibold text-gray-900 truncate">{task.name}</span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">

          {/* Task title + description */}
          <div className="mb-5 rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex items-start gap-3 flex-wrap mb-3">
              <TaskStatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950 leading-tight">{task.name}</h1>
            {task.description && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4 flex-wrap text-xs text-gray-400">
              {task.owner && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={task.owner.fullName} size="xs" />
                  <span>{task.owner.fullName}</span>
                </div>
              )}
              {task.plannedDueDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className={task.status !== 'done' && new Date(task.plannedDueDate) < new Date() ? 'text-red-500 font-medium' : ''}>
                    Due {formatDate(task.plannedDueDate)}
                  </span>
                </div>
              )}
              {task.assignees.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{task.assignees.map((a: any) => a.fullName).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

            {/* Left: main sections */}
            <div className="space-y-4">
              <StepsSection taskId={taskId} />
              <EffortSection task={task} isAdmin={isAdmin} />
              <AttachmentsSection taskId={taskId} />
              <NotesSection taskId={taskId} />
              <CommentsSection taskId={taskId} />
              <AssignmentHistory taskId={taskId} />
              <AuditTimeline taskId={taskId} />
            </div>

            {/* Right: properties sidebar */}
            <div>
              <PropertiesSidebar task={task} isAdmin={isAdmin} companyId={companyId} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
