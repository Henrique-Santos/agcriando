import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogBrowser } from '@/components/loja/CatalogBrowser';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCatalog } from '@/lib/api/server';
import { categoryLabel } from '@/lib/catalog';
import { SITE_URL } from '@/lib/config';
import { breadcrumbJsonLd } from '@/lib/seo';

type Props = { params: Promise<{ categoria: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const label = categoryLabel(await getCatalog(), categoria);
  return label
    ? {
        title: `${label} sob encomenda em Joinville`,
        description: `${label}: peças personalizadas com nome, frase ou tema, feitas sob encomenda em Joinville (SC) pela AG Criando. Peça pelo WhatsApp.`,
        alternates: { canonical: `/catalogo/${categoria}` },
      }
    : { title: 'Categoria não encontrada' };
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  const catalog = await getCatalog();
  if (!catalog.categories.some((c) => c.id === categoria)) notFound();

  const breadcrumb = breadcrumbJsonLd(SITE_URL, [
    { name: 'Catálogo', path: '/catalogo' },
    { name: categoryLabel(catalog, categoria), path: `/catalogo/${categoria}` },
  ]);

  return (
    <Suspense>
      <JsonLd data={breadcrumb} />
      <CatalogBrowser catalog={catalog} categoryId={categoria} />
    </Suspense>
  );
}
