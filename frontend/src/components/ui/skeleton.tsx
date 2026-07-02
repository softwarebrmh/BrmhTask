import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-shimmer rounded-md', className)} />;
}

export function TableRowsSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className={cn('h-4', c === 0 ? 'w-3/4' : 'w-16')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-5 space-y-3', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
