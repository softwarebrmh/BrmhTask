import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-gray-950 text-white shadow-[0_1px_2px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-gray-800 active:bg-gray-900 focus-visible:ring-gray-900/20',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200/80 active:bg-gray-200 focus-visible:ring-gray-400/30',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 focus-visible:ring-gray-300/40',
  danger:    'bg-red-600 text-white shadow-[0_1px_2px_rgba(220,38,38,0.3)] hover:bg-red-700 focus-visible:ring-red-500/30',
  outline:   'border border-gray-200 bg-white text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-300/40',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
