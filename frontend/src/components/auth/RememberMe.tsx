'use client';

import { useId } from 'react';

interface RememberMeProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function RememberMe({ checked, onChange }: RememberMeProps) {
  const id = useId();
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-gray-950 focus:ring-gray-900/10 focus:ring-offset-0"
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-700 select-none cursor-pointer">
        Remember Me
      </label>
    </div>
  );
}
