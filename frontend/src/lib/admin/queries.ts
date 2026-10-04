'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/browser';
import type { AdminCategory, Me, Product, ProductList } from '../api/types';

export type ProductFilters = { q: string; cat: string; status: 'all' | 'on' | 'off' };

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => ['products', filters] as const,
};
export const categoryKeys = { all: ['categories'] as const };

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/api/auth/me') });

export const useProducts = (filters: ProductFilters) => useQuery({
  queryKey: productKeys.list(filters),
  queryFn: () => api<ProductList>(`/api/admin/products?${new URLSearchParams({ q: filters.q, cat: filters.cat, status: filters.status })}`),
  placeholderData: keepPreviousData,
});

export const useCategories = () => useQuery({
  queryKey: categoryKeys.all,
  queryFn: () => api<AdminCategory[]>('/api/admin/categories'),
});

export const useLogout = () => useMutation({ mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }) });

type ProductPatch = { id: string; price?: number; active?: boolean; featured?: boolean };

export function usePatchProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: ProductPatch) =>
      api<Product>(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', json: patch }),
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.all });
      const previous = queryClient.getQueriesData<ProductList>({ queryKey: productKeys.all });
      queryClient.setQueriesData<ProductList>({ queryKey: productKeys.all }, (old) =>
        old && { ...old, items: old.items.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
      return { previous };
    },
    onError: (_error, _patch, context) => context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
      queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    ]),
  });
}
