'use client';

import { useState } from 'react';
import { parsePrice } from '@/lib/admin/product-form';

const display = (value: number) => value.toFixed(2).replace('.', ',');

export function PriceInput({ value, label, onCommit }: { value: number; label: string; onCommit: (price: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const price = parsePrice(draft);
    setDraft(null);
    if (price > 0 && price !== value) onCommit(price);
  };

  return (
    <div className="relative">
      <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-sm text-neutral-700">R$</span>
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        className="input min-h-[40px] pl-[34px] text-[15px]"
        value={draft ?? display(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setDraft(null);
        }}
      />
    </div>
  );
}
