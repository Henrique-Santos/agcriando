'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api/browser';
import { ToastProvider } from './Toast';

const backToLoginOn401 = (error: unknown) => {
  // Recarrega a página inteira para descartar o estado do painel quando a sessão expira.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (error instanceof ApiError && error.status === 401) window.location.assign('/admin/login');
};

export function AdminProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } },
    queryCache: new QueryCache({ onError: backToLoginOn401 }),
    mutationCache: new MutationCache({ onError: backToLoginOn401 }),
  }));

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
