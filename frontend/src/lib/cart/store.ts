import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = { productId: string; qty: number; option: string | null; text: string; obs: string };

type CartState = {
  items: CartItem[];
  customer: string;
  open: boolean;
  add: (item: CartItem) => void;
  increment: (index: number) => void;
  decrement: (index: number, min: number) => void;
  remove: (index: number) => void;
  setCustomer: (customer: string) => void;
  prune: (validIds: ReadonlySet<string>) => void;
  setOpen: (open: boolean) => void;
};

const updateQty = (items: CartItem[], index: number, qty: (current: number) => number) =>
  items.map((item, i) => (i === index ? { ...item, qty: qty(item.qty) } : item));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      customer: '',
      open: false,
      add: (item) => set((s) => ({ items: [...s.items, item] })),
      increment: (index) => set((s) => ({ items: updateQty(s.items, index, (q) => q + 1) })),
      decrement: (index, min) => set((s) => ({ items: updateQty(s.items, index, (q) => Math.max(min, q - 1)) })),
      remove: (index) => set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
      setCustomer: (customer) => set({ customer }),
      prune: (validIds) => set((s) => ({ items: s.items.filter((item) => validIds.has(item.productId)) })),
      setOpen: (open) => set({ open }),
    }),
    {
      name: 'agc-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, customer: s.customer }),
      // Reidratado no cliente pelo CatalogProvider, evitando divergência com o HTML do servidor.
      skipHydration: true,
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.qty, 0);
