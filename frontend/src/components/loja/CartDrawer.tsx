'use client';

import { WhatsappLogo, X } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { Field } from '@/components/ui/Field';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { cartLines, cartTotal, lineDetail, toOrderLines } from '@/lib/cart/order';
import { useCart } from '@/lib/cart/store';
import { brl } from '@/lib/format';
import { buildOrderMessage, waLink } from '@/lib/whatsapp';
import { useCatalog } from './CatalogProvider';

export function CartDrawer() {
  const { productsById } = useCatalog();
  const items = useCart((s) => s.items);
  const customer = useCart((s) => s.customer);
  const open = useCart((s) => s.open);
  const { setOpen, increment, decrement, remove, setCustomer } = useCart.getState();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') useCart.getState().setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const lines = cartLines(items, productsById);
  const send = () => window.open(waLink(buildOrderMessage(toOrderLines(lines), customer)), '_blank');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div aria-hidden className="absolute inset-0 animate-fade bg-[color-mix(in_srgb,var(--color-neutral-900)_45%,transparent)]" onClick={() => setOpen(false)} />
      <aside role="dialog" aria-modal="true" aria-label="Minha lista" className="relative flex h-full w-[min(440px,100%)] animate-slide-in flex-col bg-bg shadow-lg">
        <div className="flex items-center px-4 pb-3 pt-4">
          <h2 className="mr-auto text-[26px]">Minha lista</h2>
          <button type="button" className="btn btn-icon btn-ghost" onClick={() => setOpen(false)} aria-label="Fechar">
            <X weight="duotone" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-8">
              <p className="text-xl italic">Sua lista ainda está vazia.</p>
              <p className="text-[15px] text-neutral-800">Escolha os produtos, personalize e adicione aqui. Depois é só enviar tudo de uma vez pelo WhatsApp.</p>
              <Link href="/catalogo" className="btn btn-primary" onClick={() => setOpen(false)}>Ver catálogo</Link>
            </div>
          ) : (
            lines.map((line) => {
              const detail = lineDetail(line);
              return (
                <div key={line.index} className="flex gap-3 border-b border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] py-3">
                  <div className="bg-stripes relative h-[90px] w-[72px] flex-none overflow-hidden rounded-md">
                    {line.product.imageUrl && <Image src={line.product.imageUrl} alt="" fill sizes="72px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base font-semibold leading-tight">{line.product.name}</span>
                    {detail && <span className="text-[13px] leading-[1.4] text-neutral-800">{detail}</span>}
                    <div className="mt-1 flex items-center gap-2">
                      <QtyStepper
                        size="sm"
                        value={line.item.qty}
                        onIncrement={() => increment(line.index)}
                        onDecrement={() => decrement(line.index, line.product.minQuantity ?? 1)}
                      />
                      <button type="button" className="text-[13px] text-neutral-700 underline" onClick={() => remove(line.index)}>remover</button>
                      <span className="ml-auto text-[15px]">{brl(line.product.price * line.item.qty)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {lines.length > 0 && (
          <div className="flex flex-col gap-3 bg-surface p-4">
            <div className="flex items-baseline">
              <span className="mr-auto text-[15px]">Total estimado</span>
              <span className="text-2xl font-semibold">{brl(cartTotal(lines))}</span>
            </div>
            <Field label="Seu nome" htmlFor="cart-customer">
              <input
                id="cart-customer"
                className="input min-h-[44px] bg-bg text-base"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Para sabermos quem está pedindo"
                autoComplete="name"
              />
            </Field>
            <button type="button" className="btn btn-primary min-h-[50px] text-base" onClick={send}>
              <WhatsappLogo weight="duotone" size={20} /> Enviar pedido pelo WhatsApp
            </button>
            <p className="text-xs text-neutral-700">Você revisa a mensagem antes de enviar. Frete, prazo e pagamento são combinados na conversa.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
