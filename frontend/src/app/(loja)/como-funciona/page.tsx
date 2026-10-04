import { Clock, Package, Wallet } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { STEPS } from '@/lib/content';

export const metadata: Metadata = { title: 'Como funciona', description: 'Da sua ideia até as suas mãos, em quatro passos.' };

const extras = [
  { icon: Clock, title: 'Prazos', text: 'De 3 a 10 dias úteis após a aprovação da arte, conforme o produto e a quantidade. Arquivos digitais em até 2 dias úteis.' },
  { icon: Wallet, title: 'Pagamento', text: 'Pix ou cartão, combinado no WhatsApp. A produção começa após a confirmação do pagamento.' },
  { icon: Package, title: 'Entrega', text: 'Retirada combinada ou envio. O valor do frete é informado junto com o orçamento.' },
];

export default function HowItWorksPage() {
  return (
    <section className="pb-24 pt-8">
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-accent-700">Como funciona</p>
      <h1 className="mb-4 max-w-[820px] text-[clamp(40px,6vw,68px)] leading-[1.05] tracking-[-0.03em]">Da sua ideia até as suas mãos, em quatro passos.</h1>
      <p className="mb-[72px] max-w-[560px] text-lg text-neutral-800">Por enquanto, todos os pedidos são finalizados pelo WhatsApp. Em breve você também poderá pagar direto pelo site.</p>
      <div className="flex max-w-[900px] flex-col gap-[64px]">
        {STEPS.map((s) => (
          <div key={s.n} className="flex flex-wrap items-start gap-x-8 gap-y-4">
            <div className="w-[90px] flex-none font-heading text-[88px] font-semibold leading-none text-accent">{s.n}</div>
            <div className="flex-[1_1_320px] pt-2">
              <h2 className="mb-2 text-[30px]">{s.title}</h2>
              <p className="text-pretty text-lg leading-[1.6] text-neutral-800">{s.long}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-24 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
        {extras.map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <h3 className="mb-2 flex items-center gap-2 text-[22px]"><Icon weight="duotone" className="text-accent" /> {title}</h3>
            <p className="text-base text-neutral-800">{text}</p>
          </div>
        ))}
      </div>
      <Link href="/catalogo" className="btn btn-primary mt-[72px] px-[22px] py-[14px] text-base">Começar minha lista</Link>
    </section>
  );
}
