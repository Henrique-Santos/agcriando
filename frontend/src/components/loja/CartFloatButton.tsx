'use client';

import { ShoppingBagOpen } from '@phosphor-icons/react/ssr';
import { cartCount, useCart } from '@/lib/cart/store';

export function CartFloatButton() {
  const items = useCart((s) => s.items);
  const open = useCart((s) => s.open);
  if (items.length === 0 || open) return null;

  return (
    <button
      type="button"
      onClick={() => useCart.getState().setOpen(true)}
      className="fixed bottom-[16px] right-[16px] z-[25] flex items-center gap-2 rounded-[28px] bg-accent px-[18px] py-[14px] text-[15px] font-semibold text-white shadow-lg desktop:hidden"
    >
      <ShoppingBagOpen weight="duotone" size={20} />Ver lista ({cartCount(items)})
    </button>
  );
}
