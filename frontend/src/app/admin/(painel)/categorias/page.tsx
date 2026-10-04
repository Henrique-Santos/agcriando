import type { Metadata } from 'next';
import { CategoriesPanel } from '@/components/admin/CategoriesPanel';

export const metadata: Metadata = { title: 'Categorias' };

export default function CategoriesPage() {
  return <CategoriesPanel />;
}
