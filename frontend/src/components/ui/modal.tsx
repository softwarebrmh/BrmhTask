'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-gray-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.14)]',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            sizeClasses[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-gray-500">{description}</Dialog.Description>
              )}
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
