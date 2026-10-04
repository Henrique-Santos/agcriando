import { describe, expect, it } from 'vitest';
import { catalog } from '@/test/fixtures';
import { cartLines, cartTotal, lineDetail, toOrderLines } from './order';
import type { CartItem } from './store';

const products = new Map(catalog.products.map((p) => [p.id, p]));
const items: CartItem[] = [
  { productId: 'caderno-floral', qty: 2, option: 'Pontilhado', text: 'Emelli', obs: 'lilás' },
  { productId: 'removido', qty: 1, option: null, text: '', obs: '' },
  { productId: 'botton-jw', qty: 10, option: null, text: '', obs: '' },
];

describe('cart order helpers', () => {
  it('skips items whose product is missing and keeps original indexes', () => {
    const lines = cartLines(items, products);
    expect(lines.map((l) => [l.index, l.product.id])).toEqual([[0, 'caderno-floral'], [2, 'botton-jw']]);
  });

  it('sums the total', () => {
    expect(cartTotal(cartLines(items, products))).toBeCloseTo(184.8);
  });

  it('maps to WhatsApp order lines', () => {
    expect(toOrderLines(cartLines(items, products))[0]).toEqual({
      name: 'Caderno floral com nome', qty: 2, unitPrice: 69.9, optionName: 'Miolo', option: 'Pontilhado',
      fieldLabel: 'Nome na capa', text: 'Emelli', obs: 'lilás',
    });
  });

  it('describes the customization like the prototype', () => {
    expect(lineDetail(cartLines(items, products)[0])).toBe('Pontilhado · “Emelli” · lilás');
    expect(lineDetail(cartLines(items, products)[1])).toBe('');
  });
});
