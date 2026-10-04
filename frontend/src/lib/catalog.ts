import type { Catalog, Product } from './api/types';
import { brl } from './format';

export type SortOrder = 'rel' | 'menor' | 'maior';

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'rel', label: 'Mais pedidos' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
];

export const parseSort = (value: string | null): SortOrder => (value === 'menor' || value === 'maior' ? value : 'rel');

export const categoryLabel = (catalog: Catalog, id: string) => catalog.categories.find((c) => c.id === id)?.label ?? '';

export type CategoryLink = { id: string; label: string; imageUrl: string | null; count: number };

export function categoryLinks(catalog: Catalog): CategoryLink[] {
  return catalog.categories
    .map((c) => {
      const items = catalog.products.filter((p) => p.categoryId === c.id);
      return { id: c.id, label: c.label, imageUrl: items.find((p) => p.imageUrl)?.imageUrl ?? null, count: items.length };
    })
    .filter((link) => link.count > 0);
}

export function featuredProducts(catalog: Catalog): Product[] {
  const featured = catalog.products.filter((p) => p.featured);
  return featured.length > 0 ? featured : catalog.products.slice(0, 8);
}

export function relatedProducts(catalog: Catalog, product: Product, limit = 4): Product[] {
  const others = catalog.products.filter((p) => p.id !== product.id);
  return [
    ...others.filter((p) => p.categoryId === product.categoryId),
    ...others.filter((p) => p.categoryId !== product.categoryId),
  ].slice(0, limit);
}

export function filterProducts(
  catalog: Catalog,
  { categoryId, query, sort }: { categoryId?: string; query: string; sort: SortOrder },
): Product[] {
  const q = query.trim().toLowerCase();
  const list = catalog.products.filter((p) =>
    (!categoryId || p.categoryId === categoryId) &&
    (!q || `${p.name} ${categoryLabel(catalog, p.categoryId)}`.toLowerCase().includes(q)));

  if (sort === 'menor') return [...list].sort((a, b) => a.price - b.price);
  if (sort === 'maior') return [...list].sort((a, b) => b.price - a.price);
  return list;
}

export const priceLabel = (p: Pick<Product, 'price' | 'minQuantity'>) => brl(p.price) + (p.minQuantity ? ' / un.' : '');
