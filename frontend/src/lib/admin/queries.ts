'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/browser';
import type { AdminCategory, Me, Product, ProductInput, ProductList, UploadedImage } from '../api/types';

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

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ProductInput }) =>
      id
        ? api<Product>(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PUT', json: input })
        : api<Product>('/api/admin/products', { method: 'POST', json: input }),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
      queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    ]),
  });
}

export const useUploadImage = () => useMutation({
  mutationFn: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api<UploadedImage>('/api/admin/uploads', { method: 'POST', body });
  },
});
function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
  ]);
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (label: string) => api<AdminCategory>('/api/admin/categories', { method: 'POST', json: { label } }),
    onSuccess: invalidate,
  });
}

export function useRenameCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      api<AdminCategory>(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'PUT', json: { label } }),
    onSuccess: invalidate,
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api<void>('/api/admin/categories/order', { method: 'PUT', json: { ids } }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all });
      const previous = queryClient.getQueryData<AdminCategory[]>(categoryKeys.all);
      queryClient.setQueryData<AdminCategory[]>(categoryKeys.all, (old) =>
        old && ids.map((id, i) => ({ ...old.find((c) => c.id === id)!, sortOrder: i })));
      return { previous };
    },
    onError: (_e, _ids, context) => queryClient.setQueryData(categoryKeys.all, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
