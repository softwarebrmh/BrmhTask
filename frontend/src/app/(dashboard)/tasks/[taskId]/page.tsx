'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock, Calendar, User, CheckSquare, Paperclip, FileText,
  MessageSquare, Plus, Check, Trash2, Upload, ChevronRight,
  MoreHorizontal, Edit2, X,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageSpinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useTaskDetail } from '@/lib/hooks/use-tasks';
import { stepsApi, attachmentsApi, notesApi, commentsApi, tasksApi } from '@/lib/api';
import { taskKeys } from '@/lib/hooks/use-tasks';
import { formatDate, formatDateTime, formatFileSize, timeAgo, extractError } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { TaskStatus } from '@/types';

// ─── Transitions ─────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo:        ['in_progress'],
  in_progress: ['review'],
  review:      ['done', 'in_progress'],
  done:        ['review'],
};

// ─── Status control ───────────────────────────────────────────────────────────

function StatusSelect({ taskId, current }: { taskId: string; current: TaskStatus }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (s: TaskStatus) => tasksApi.updateStatus(taskId, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) }); toast.success('Status updated'); },
    onError: (e) => toast.error(extractError(e)),
  });
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <TaskStatusBadge status={current} />
      {(VALID_TRANSITIONS[current] ?? []).map((s) => (
        <button
          key={s}
          onClick={() => update.mutate(s)}
          disabled={update.isPending}
          className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Move to {s.replace('_', ' ')}
        </button>
      ))}
    </div>
  );
}

// ─── Steps panel ─────────────────────────────────────────────────────────────

function StepsPanel({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');

  const { data: steps = [] } = useQuery({
    queryKey: ['steps', taskId],
    queryFn: () => stepsApi.list(taskId).then((r) => r.data.data),
  });

  const toggle = useMutation({
    mutationFn: ({ stepId, isChecked }: { stepId: string; isChecked: boolean }) =>
      isChecked ? stepsApi.uncheck(taskId, stepId) : stepsApi.check(taskId, stepId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['steps', taskId] }); qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) }); },
    onError: (e) => toast.error(extractError(e)),
  });

  const add = useMutation({
    mutationFn: (title: string) => stepsApi.create(taskId, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['steps', taskId] }); qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) }); setNewTitle(''); },
    onError: (e) => toast.error(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (stepId: string) => stepsApi.delete(taskId, stepId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['steps', taskId] }); qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) }); },
    onError: (e) => toast.error(extractError(e)),
  });

  const done = steps.filter((s) => s.isChecked).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <CheckSquare className="h-4 w-4 text-gray-500" />
          Steps
          {steps.length > 0 && <span className="text-gray-400 font-normal">({done}/{steps.length})</span>}
        </h3>
      </div>

      {steps.length > 0 && (
        <div className="h-1.5 rounded-full bg-gray-100 mb-3">
          <div className="h-1.5 rounded-full bg-gray-900 transition-all" style={{ width: `${steps.length ? Math.round((done / steps.length) * 100) : 0}%` }} />
        </div>
      )}

      <div className="space-y-1">
        {steps.map((step) => (
          <div key={step.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50">
            <button
              onClick={() => toggle.mutate({ stepId: step.id, isChecked: step.isChecked })}
              className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                step.isChecked ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-300 hover:border-gray-500'
              }`}
            >
              {step.isChecked && <Check className="h-3 w-3" />}
            </button>
            <span className={`flex-1 text-sm ${step.isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {step.title}
            </span>
            <button
              onClick={() => del.mutate(step.id)}
              className="hidden group-hover:flex items-center text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a step and press Enter…"
          className="h-8 flex-1 rounded-md border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) add.mutate(newTitle.trim()); }}
        />
        <Button size="sm" variant="secondary" onClick={() => newTitle.trim() && add.mutate(newTitle.trim())} disabled={!newTitle.trim() || add.isPending}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Attachments panel ────────────────────────────────────────────────────────

function AttachmentsPanel({ taskId }: { taskId: string }) {
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attachments', taskId] }); toast.success('Attachment deleted'); },
    onError: (e) => toast.error(extractError(e)),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Paperclip className="h-4 w-4 text-gray-500" />
          Attachments
          {attachments.length > 0 && <span className="text-gray-400 font-normal">({attachments.length})</span>}
        </h3>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} loading={upload.isPending}>
          <Upload className="h-3.5 w-3.5" /> Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])}
        />
      </div>

      {attachments.length === 0 ? (
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-200 py-8 transition-colors hover:border-gray-300 hover:bg-gray-50/60"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-6 w-6 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Click to upload a file</p>
          <p className="text-xs text-gray-300 mt-1">Max 10 MB</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5 group">
              <Paperclip className="h-4 w-4 text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={attachmentsApi.downloadUrl(taskId, a.id)}
                  className="block truncate text-sm font-medium text-gray-800 hover:text-gray-950"
                  download
                >
                  {a.fileName}
                </a>
                <p className="text-xs text-gray-400">{formatFileSize(a.fileSize)} · {a.uploader.fullName} · {timeAgo(a.createdAt)}</p>
              </div>
              <button
                onClick={() => del.mutate(a.id)}
                className="hidden group-hover:flex text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Notes panel ──────────────────────────────────────────────────────────────

function NotesPanel({ taskId }: { taskId: string }) {
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', taskId] }); setCreating(false); setForm({ title: '', content: '' }); toast.success('Note added'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const update = useMutation({
    mutationFn: (noteId: string) => notesApi.update(taskId, noteId, { title: editForm.title || undefined, content: editForm.content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', taskId] }); setEditingId(null); toast.success('Note updated'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(taskId, noteId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', taskId] }); toast.success('Note deleted'); },
    onError: (e) => toast.error(extractError(e)),
  });

  const notes = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-gray-500" />
          Notes
          {notes.length > 0 && <span className="text-gray-400 font-normal">({notes.length})</span>}
        </h3>
        {!creating && (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Note
          </Button>
        )}
      </div>

      {creating && (
        <div className="surface-muted space-y-3 p-4">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)"
            className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Write your note…"
            rows={4}
            className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setForm({ title: '', content: '' }); }}>Cancel</Button>
            <Button size="sm" onClick={() => form.content.trim() && create.mutate()} loading={create.isPending} disabled={!form.content.trim()}>Save note</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="group rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:border-gray-200">
            {editingId === note.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Title (optional)"
                  className="h-8 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => update.mutate(note.id)} loading={update.isPending}>Update</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    {note.title && <p className="text-sm font-semibold text-gray-900 mb-1">{note.title}</p>}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingId(note.id); setEditForm({ title: note.title ?? '', content: note.content }); }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => del.mutate(note.id)} className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Avatar name={note.author.fullName} size="xs" />
                  <span>{note.author.fullName}</span>
                  <span>·</span>
                  <span>{timeAgo(note.updatedAt)}</span>
                </div>
              </>
            )}
          </div>
        ))}

        {notes.length === 0 && !creating && (
          <p className="text-center text-sm text-gray-400 py-4">No notes yet</p>
        )}
      </div>
    </div>
  );
}

// ─── Comments panel ───────────────────────────────────────────────────────────

function CommentsPanel({ taskId }: { taskId: string }) {
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', taskId] }); setReplyingTo(null); setReplyText(''); },
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
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        Comments
        {(data?.meta?.total ?? 0) > 0 && <span className="text-gray-400 font-normal">({data?.meta?.total})</span>}
      </h3>

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            {c.author && <Avatar name={c.author.fullName} size="sm" className="shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-800">{c.author?.fullName ?? '[deleted]'}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
              </div>

              <div className="flex items-center gap-3 mt-1.5 px-1">
                <div className="flex gap-1">
                  {EMOJI_QUICK.map((e) => {
                    const count = c.reactions.filter((r) => r.emoji === e).length;
                    return (
                      <button
                        key={e}
                        onClick={() => react.mutate({ commentId: c.id, emoji: e })}
                        className={`rounded-full px-1.5 py-0.5 text-xs border transition-colors ${
                          count > 0 ? 'border-gray-300 bg-white text-gray-800' : 'border-transparent hover:border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {e}{count > 0 && ` ${count}`}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setReplyingTo(c.id); setReplyText(''); }}
                  className="text-xs text-gray-400 transition-colors hover:text-gray-700"
                >
                  Reply
                </button>
              </div>

              {c.replies.length > 0 && (
                <div className="mt-2 pl-3 border-l-2 border-gray-100 space-y-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex gap-2">
                      {r.author && <Avatar name={r.author.fullName} size="xs" className="shrink-0 mt-0.5" />}
                      <div className="flex-1 rounded-md bg-gray-50 px-2.5 py-1.5">
                        <span className="text-xs font-semibold text-gray-700 mr-1.5">{r.author?.fullName}</span>
                        <span className="text-xs text-gray-600">{r.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === c.id && (
                <div className="mt-2 flex gap-2 pl-3">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    className="h-8 flex-1 rounded-md border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    onKeyDown={(e) => { if (e.key === 'Enter' && replyText.trim()) postReply.mutate({ commentId: c.id, content: replyText.trim() }); }}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => replyText.trim() && postReply.mutate({ commentId: c.id, content: replyText.trim() })} loading={postReply.isPending} disabled={!replyText.trim()}>
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
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          className="flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey && text.trim()) post.mutate(text.trim()); }}
        />
        <Button size="sm" onClick={() => text.trim() && post.mutate(text.trim())} disabled={!text.trim()} loading={post.isPending}>
          Post
        </Button>
      </div>
    </div>
  );
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

type Tab = 'steps' | 'attachments' | 'notes' | 'comments';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'steps',       label: 'Steps',       icon: CheckSquare },
  { id: 'attachments', label: 'Files',        icon: Paperclip },
  { id: 'notes',       label: 'Notes',        icon: FileText },
  { id: 'comments',    label: 'Comments',     icon: MessageSquare },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<Tab>('steps');

  const { data: task, isLoading } = useTaskDetail(taskId);

  if (isLoading) return <PageSpinner />;
  if (!task) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <p>Task not found</p>
      <Link href="/projects" className="mt-2 text-sm font-medium text-gray-700 hover:text-gray-950">Back to projects</Link>
    </div>
  );

  const isOverdue = task.plannedDueDate && task.status !== 'done' && new Date(task.plannedDueDate) < new Date();

  return (
    <>
      <Header
        title={
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            {task.sprint && (
              <>
                <Link href={`/projects/${task.sprint.projectId}`} className="shrink-0 text-gray-400 hover:text-gray-700">Project</Link>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                <Link href={`/projects/${task.sprint.projectId}/sprints/${task.sprint.id}`} className="max-w-[120px] truncate text-gray-400 hover:text-gray-700">
                  {task.sprint.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
              </>
            )}
            <span className="font-semibold text-gray-900 truncate">{task.name}</span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* ── Left: main content ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Title + status + description */}
            <div className="surface p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-gray-950">{task.name}</h1>
                <PriorityBadge priority={task.priority} />
              </div>
              <StatusSelect taskId={task.id} current={task.status} />
              {task.description && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>
              )}
            </div>

            {/* Tabbed panels */}
            <div className="surface overflow-hidden">
              <div className="flex border-b border-gray-100 bg-gray-50/40">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === id
                        ? 'border-gray-950 text-gray-950'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {activeTab === 'steps'       && <StepsPanel       taskId={taskId} />}
                {activeTab === 'attachments' && <AttachmentsPanel taskId={taskId} />}
                {activeTab === 'notes'       && <NotesPanel       taskId={taskId} />}
                {activeTab === 'comments'    && <CommentsPanel    taskId={taskId} />}
              </div>
            </div>
          </div>

          {/* ── Right: sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Details card */}
            <div className="surface space-y-3.5 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Due date</span>
                  <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(task.plannedDueDate)}
                    {isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Estimated</span>
                  <span className="text-gray-900">{task.estimatedEffortPh}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Actual</span>
                  <span className={`font-medium ${task.slippagePh > 0 ? 'text-red-500' : task.slippagePh < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {task.actualEffortPh}h
                    {task.slippagePh !== 0 && (
                      <span className="ml-1 text-xs opacity-70">({task.slippagePh > 0 ? '+' : ''}{task.slippagePh}h)</span>
                    )}
                  </span>
                </div>
              </div>

              {task.stepProgress.total > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-medium">{task.stepProgress.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-gray-900 transition-all" style={{ width: `${task.stepProgress.percentage}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Assignees */}
            <div className="surface p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />Assignees
              </h3>
              {task.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {task.assignees.map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 py-1 pl-1 pr-2.5">
                      <Avatar name={a.fullName} src={a.avatarUrl} size="xs" />
                      <span className="text-xs text-gray-700 font-medium">{a.fullName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Unassigned</p>
              )}
            </div>

            {/* Sprint info */}
            {task.sprint && (
              <div className="surface p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sprint</h3>
                <Link
                  href={`/projects/${task.sprint.projectId}/sprints/${task.sprint.id}`}
                  className="text-sm font-medium text-gray-800 hover:text-gray-950"
                >
                  {task.sprint.name}
                </Link>
                {task.sprint.goal && <p className="text-xs text-gray-500 mt-1">{task.sprint.goal}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(task.sprint.startDate)} → {formatDate(task.sprint.endDate)}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-gray-400 space-y-1 pl-1">
              <p>Created {formatDateTime(task.createdAt)}</p>
              <p>Updated {formatDateTime(task.updatedAt)}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
