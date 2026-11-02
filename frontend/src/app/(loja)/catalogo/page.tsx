import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogBrowser } from '@/components/loja/CatalogBrowser';
import { getCatalog } from '@/lib/api/server';

export const metadata: Metadata = {
  title: 'Catálogo de personalizados em Joinville',
  description: 'Cadernos, canecas, bottons, adesivos, lembrancinhas e mais, personalizados em Joinville (SC) — escolha, personalize e peça pelo WhatsApp.',
  alternates: { canonical: '/catalogo' },
};

export default async function CatalogPage() {
  const catalog = await getCatalog();
  return (
    <Suspense>
      <CatalogBrowser catalog={catalog} />
    </Suspense>
  );
}
