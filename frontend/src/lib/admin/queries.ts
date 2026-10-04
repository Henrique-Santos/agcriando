'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api/browser';
import type { AdminCategory, Me, ProductList } from '../api/types';

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
