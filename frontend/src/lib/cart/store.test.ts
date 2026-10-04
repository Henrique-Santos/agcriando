import { beforeEach, describe, expect, it } from 'vitest';
import { cartCount, useCart, type CartItem } from './store';

const item = (over: Partial<CartItem> = {}): CartItem => ({ productId: 'caderno-floral', qty: 1, option: 'Pautado', text: 'Ana', obs: '', ...over });

describe('useCart', () => {
  beforeEach(() => useCart.setState({ items: [], customer: '', open: false }));

  it('adds items as separate lines and counts quantities', () => {
    useCart.getState().add(item({ qty: 2 }));
    useCart.getState().add(item({ text: 'Bia' }));
    expect(useCart.getState().items).toHaveLength(2);
    expect(cartCount(useCart.getState().items)).toBe(3);
  });

  it('never decrements below the minimum quantity', () => {
    useCart.getState().add(item({ productId: 'botton-jw', qty: 10 }));
    useCart.getState().decrement(0, 10);
    expect(useCart.getState().items[0].qty).toBe(10);
    useCart.getState().increment(0);
    useCart.getState().decrement(0, 10);
    expect(useCart.getState().items[0].qty).toBe(10);
  });

  it('removes a line by index', () => {
    useCart.getState().add(item({ text: 'A' }));
    useCart.getState().add(item({ text: 'B' }));
    useCart.getState().remove(0);
    expect(useCart.getState().items.map((i) => i.text)).toEqual(['B']);
  });

  it('prunes items whose product no longer exists', () => {
    useCart.getState().add(item());
    useCart.getState().add(item({ productId: 'sumiu' }));
    useCart.getState().prune(new Set(['caderno-floral']));
    expect(useCart.getState().items.map((i) => i.productId)).toEqual(['caderno-floral']);
  });

  it('persists items and customer but not the open state', async () => {
    useCart.getState().add(item());
    useCart.getState().setCustomer('Ana');
    useCart.getState().setOpen(true);

    const raw = localStorage.getItem('agc-cart')!;
    expect(JSON.parse(raw).state).toEqual({ items: [item()], customer: 'Ana' });

    // setState também grava no storage; restauramos o que estava salvo para simular uma nova visita.
    useCart.setState({ items: [], customer: '', open: false });
    localStorage.setItem('agc-cart', raw);
    await useCart.persist.rehydrate();
    expect(useCart.getState().items).toEqual([item()]);
    expect(useCart.getState().customer).toBe('Ana');
    expect(useCart.getState().open).toBe(false);
  });
});
