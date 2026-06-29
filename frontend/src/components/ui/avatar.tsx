import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

const colors = [
  'bg-red-100 text-red-700', 'bg-orange-100 text-orange-700',
  'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700', 'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
];

function colorFromName(name: string): string {
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full font-semibold', sizeClasses[size], colorFromName(name), className)}>
      {getInitials(name)}
    </span>
  );
}

export function AvatarGroup({ users, max = 3 }: { users: Array<{ fullName: string; avatarUrl?: string | null }>; max?: number }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  return (
    <div className="flex -space-x-1.5">
      {visible.map((u, i) => (
        <Avatar key={i} name={u.fullName} src={u.avatarUrl} size="sm" className="ring-2 ring-white" />
      ))}
      {remaining > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-600">
          +{remaining}
        </span>
      )}
    </div>
  );
}
