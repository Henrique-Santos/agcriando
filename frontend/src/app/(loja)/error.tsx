'use client';

import { useEffect } from 'react';
import { GENERIC_MESSAGE, waLink } from '@/lib/whatsapp';

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-[620px] flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-[clamp(32px,5vw,48px)] leading-[1.1] tracking-[-0.02em]">Não conseguimos carregar a loja agora.</h1>
      <p className="text-[17px] text-neutral-800">
        Tente de novo em instantes. Se preferir, <a href={waLink(GENERIC_MESSAGE)} target="_blank" rel="noopener noreferrer">fale com a gente pelo WhatsApp</a>.
      </p>
      <button type="button" className="btn btn-primary text-base" onClick={reset}>Tentar de novo</button>
    </section>
  );
}
