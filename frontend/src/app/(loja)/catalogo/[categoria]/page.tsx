import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogBrowser } from '@/components/loja/CatalogBrowser';
import { getCatalog } from '@/lib/api/server';
import { categoryLabel } from '@/lib/catalog';

type Props = { params: Promise<{ categoria: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const label = categoryLabel(await getCatalog(), categoria);
  return label
    ? { title: label, description: `${label} personalizados pela AG Criando.`, alternates: { canonical: `/catalogo/${categoria}` } }
    : { title: 'Categoria não encontrada' };
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  const catalog = await getCatalog();
  if (!catalog.categories.some((c) => c.id === categoria)) notFound();

  return (
    <Suspense>
      <CatalogBrowser catalog={catalog} categoryId={categoria} />
    </Suspense>
  );
}
