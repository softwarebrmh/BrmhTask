import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority, MemberStatus } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-gray-200 bg-white text-gray-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger:  'border-red-200 bg-red-50 text-red-700',
  info:    'border-sky-200 bg-sky-50 text-sky-700',
  purple:  'border-violet-200 bg-violet-50 text-violet-700',
  gray:    'border-gray-200 bg-gray-50 text-gray-600',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-sky-500',
  purple:  'bg-violet-500',
  gray:    'bg-gray-400',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[variant])} />}
      {children}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; variant: BadgeVariant }> = {
    todo:        { label: 'Todo',        variant: 'gray' },
    in_progress: { label: 'In Progress', variant: 'info' },
    review:      { label: 'Review',      variant: 'purple' },
    completed:   { label: 'Completed',   variant: 'success' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, { label: string; variant: BadgeVariant }> = {
    low:      { label: 'Low',      variant: 'gray' },
    medium:   { label: 'Medium',   variant: 'info' },
    high:     { label: 'High',     variant: 'warning' },
    critical: { label: 'Critical', variant: 'danger' },
  };
  const { label, variant } = map[priority];
  return <Badge variant={variant}>{label}</Badge>;
}

export function StaffStatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; variant: BadgeVariant }> = {
    invited:   { label: 'Invited',   variant: 'warning' },
    active:    { label: 'Active',    variant: 'success' },
    suspended: { label: 'Suspended', variant: 'danger' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}
