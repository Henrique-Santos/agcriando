'use client';

import { Minus, Plus } from '@phosphor-icons/react/ssr';
import { useState } from 'react';

export function FaqList({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col">
      {items.map(([question, answer], i) => {
        const expanded = open === i;
        return (
          <div key={question} className="border-t border-divider">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-[22px] text-left text-[21px] font-semibold text-text"
            >
              <span>{question}</span>
              {expanded
                ? <Minus weight="duotone" size={20} className="flex-none text-accent" aria-hidden />
                : <Plus weight="duotone" size={20} className="flex-none text-accent" aria-hidden />}
            </button>
            {expanded && <p className="mb-[24px] max-w-[680px] animate-fade text-[17px] leading-[1.6] text-neutral-800">{answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
