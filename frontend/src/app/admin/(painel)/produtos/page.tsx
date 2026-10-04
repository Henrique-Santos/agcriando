import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsPanel } from '@/components/admin/ProductsPanel';

export const metadata: Metadata = { title: 'Produtos' };

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPanel />
    </Suspense>
  );
}
