import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/api/server';
import { SITE_URL } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const url = (path: string) => `${SITE_URL}${path}`;
  return [
    ...['/', '/catalogo', '/como-funciona', '/sobre', '/duvidas', '/contato'].map((p) => ({ url: url(p) })),
    ...catalog.categories.map((c) => ({ url: url(`/catalogo/${c.id}`) })),
    ...catalog.products.map((p) => ({ url: url(`/produto/${p.id}`), images: p.imageUrl ? [p.imageUrl] : undefined })),
  ];
}
