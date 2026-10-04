import type { Metadata } from 'next';
import { FaqList } from '@/components/loja/FaqList';
import { FAQ } from '@/lib/content';
import { GENERIC_MESSAGE, waLink } from '@/lib/whatsapp';

export const metadata: Metadata = { title: 'Dúvidas frequentes', description: 'Prazos, pagamento, entrega e pedidos em quantidade.' };

export default function FaqPage() {
  return (
    <section className="max-w-[820px] pb-24 pt-8">
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-accent-700">Dúvidas frequentes</p>
      <h1 className="mb-8 text-[clamp(40px,6vw,68px)] leading-[1.05] tracking-[-0.03em]">Perguntas que sempre chegam por aqui.</h1>
      <FaqList items={FAQ} />
      <p className="mt-8 text-[17px]">
        Ficou alguma dúvida? <a href={waLink(GENERIC_MESSAGE)} target="_blank" rel="noopener noreferrer">Chame no WhatsApp</a>.
      </p>
    </section>
  );
}
