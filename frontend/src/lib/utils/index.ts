import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy · HH:mm');
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function extractError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as any).response;
    return res?.data?.error?.message ?? res?.data?.message ?? 'An error occurred';
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}
