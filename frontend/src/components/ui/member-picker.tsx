'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, X, Check, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { staffApi } from '@/lib/api';
import { extractError } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  user: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  addedBy?: { id: string; fullName: string };
  addedAt: string;
}

interface MemberPickerProps {
  companyId: string;
  members: Member[];
  onAdd: (userId: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  isAdmin: boolean;
  queryKey: string[];
}

export function MemberPicker({ companyId, members, onAdd, onRemove, isAdmin, queryKey }: MemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: staffData } = useQuery({
    queryKey: ['staff-picker', companyId],
    queryFn: () => staffApi.list(companyId, { status: 'active', limit: 100 } as any).then((r) => r.data),
    enabled: open && !!companyId,
  });

  const memberUserIds = new Set(members.map((m) => m.user.id));

  const staffList = (staffData?.data ?? []).filter(
    (s: any) => s.user && s.user.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = async (userId: string) => {
    try {
      if (memberUserIds.has(userId)) {
        await onRemove(userId);
      } else {
        await onAdd(userId);
      }
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      toast.error(extractError(e));
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {members.length === 0 ? (
          <p className="text-xs text-gray-400">No members assigned</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-1 pr-2.5">
              <Avatar name={m.user.fullName} src={m.user.avatarUrl} size="xs" />
              <span className="text-xs text-gray-700 font-medium">{m.user.fullName}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Member chips */}
      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <div key={m.id} className="group flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-1 pr-2">
              <Avatar name={m.user.fullName} src={m.user.avatarUrl} size="xs" />
              <span className="text-xs text-gray-700 font-medium">{m.user.fullName}</span>
              <button
                onClick={() => toggle(m.user.id)}
                className="hidden group-hover:flex text-gray-300 hover:text-red-500 transition-colors ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button / picker */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors w-full"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {members.length === 0 ? 'Assign members' : 'Add more'}
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-2 border-b border-gray-100">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="flex-1 text-sm outline-none"
            />
            <button onClick={() => { setOpen(false); setSearch(''); }}>
              <X className="h-4 w-4 text-gray-400 hover:text-gray-700" />
            </button>
          </div>
          <ul className="max-h-44 overflow-y-auto">
            {staffList.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400 text-center">No active staff found</li>
            )}
            {staffList.map((s: any) => {
              const isAdded = s.user && memberUserIds.has(s.user.id);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => s.user && toggle(s.user.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar name={s.user?.fullName ?? s.email} size="xs" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium text-gray-800 truncate">{s.user?.fullName ?? s.email}</p>
                      {s.designation && <p className="text-xs text-gray-400 truncate">{s.designation}</p>}
                    </div>
                    {isAdded && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
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

// ─── Compact avatar stack for display ─────────────────────────────────────────

export function MemberAvatarStack({ members, max = 4 }: { members: Member[]; max?: number }) {
  if (members.length === 0) return <span className="text-xs text-gray-400">No members</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {members.slice(0, max).map((m) => (
          <Avatar key={m.id} name={m.user.fullName} src={m.user.avatarUrl} size="xs" className="ring-2 ring-white" />
        ))}
      </div>
      {members.length > max && (
        <span className="text-xs text-gray-400">+{members.length - max}</span>
      )}
      <span className="text-xs text-gray-500">
        {members.slice(0, max).map((m) => m.user.fullName.split(' ')[0]).join(', ')}
        {members.length > max && ` +${members.length - max}`}
      </span>
    </div>
  );
}
