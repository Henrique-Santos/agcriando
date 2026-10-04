import { describe, expect, it } from 'vitest';
import { catalog, product } from '@/test/fixtures';
import {
  categoryLabel, categoryLinks, featuredProducts, filterProducts, parseSort, priceLabel, relatedProducts,
} from './catalog';

describe('catalog helpers', () => {
  it('finds category labels', () => {
    expect(categoryLabel(catalog, 'canecas')).toBe('Canecas & potes');
    expect(categoryLabel(catalog, 'x')).toBe('');
  });

  it('lists only categories with products, with a cover photo and count', () => {
    expect(categoryLinks(catalog)).toEqual([
      { id: 'cadernos', label: 'Cadernos & planners', imageUrl: 'https://media.test/products/floral.webp', count: 1 },
      { id: 'canecas', label: 'Canecas & potes', imageUrl: 'https://media.test/products/caneca.webp', count: 1 },
      { id: 'bottons', label: 'Bottons', imageUrl: null, count: 1 },
    ]);
  });

  it('returns featured products, or the first eight when none is featured', () => {
    expect(featuredProducts(catalog).map((p) => p.id)).toEqual(['caderno-floral', 'caneca-princesa']);
    const none = { ...catalog, products: catalog.products.map((p) => ({ ...p, featured: false })) };
    expect(featuredProducts(none)).toHaveLength(3);
  });

  it('suggests same-category products first, then others', () => {
    const extra = { ...catalog, products: [...catalog.products, product({ id: 'caderno-2', name: 'Outro caderno' })] };
    expect(relatedProducts(extra, extra.products[0]).map((p) => p.id)).toEqual(['caderno-2', 'caneca-princesa', 'botton-jw']);
  });

  it('filters by category and text (name or category label) and sorts by price', () => {
    expect(filterProducts(catalog, { query: 'CANECA', sort: 'rel' }).map((p) => p.id)).toEqual(['caneca-princesa']);
    expect(filterProducts(catalog, { query: 'planners', sort: 'rel' }).map((p) => p.id)).toEqual(['caderno-floral']);
    expect(filterProducts(catalog, { categoryId: 'bottons', query: '', sort: 'rel' }).map((p) => p.id)).toEqual(['botton-jw']);
    expect(filterProducts(catalog, { query: '', sort: 'menor' }).map((p) => p.price)).toEqual([4.5, 39.9, 69.9]);
    expect(filterProducts(catalog, { query: '', sort: 'maior' }).map((p) => p.price)).toEqual([69.9, 39.9, 4.5]);
  });

  it('labels prices per unit when there is a minimum order', () => {
    expect(priceLabel(catalog.products[0])).toBe('R$ 69,90');
    expect(priceLabel(catalog.products[2])).toBe('R$ 4,50 / un.');
  });

  it('parses the sort query parameter', () => {
    expect(parseSort('menor')).toBe('menor');
    expect(parseSort('maior')).toBe('maior');
    expect(parseSort('qualquer')).toBe('rel');
    expect(parseSort(null)).toBe('rel');
  });
});
