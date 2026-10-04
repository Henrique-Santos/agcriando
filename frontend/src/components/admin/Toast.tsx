'use client';

import { CheckCircle, Warning } from '@phosphor-icons/react/ssr';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Show = (message: string, error?: boolean) => void;

const ToastContext = createContext<Show>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback<Show>((message, error = false) => {
    clearTimeout(timer.current);
    setToast({ message, error });
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext value={show}>
      {children}
      {toast && (
        <div
          role="status"
          className={cn(
            'fixed bottom-[24px] left-1/2 z-[70] flex -translate-x-1/2 animate-up items-center gap-2 rounded-md px-[18px] py-3 text-[15px] text-bg shadow-lg',
            toast.error ? 'bg-accent-2-700' : 'bg-text',
          )}
        >
          {toast.error ? <Warning weight="duotone" size={18} /> : <CheckCircle weight="duotone" size={18} />}
          {toast.message}
        </div>
      )}
    </ToastContext>
  );
}

export const useToast = () => useContext(ToastContext);
