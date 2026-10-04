'use client';

import { Eye, EyeSlash, MagnifyingGlass, PencilSimple, Plus, Star, Trash } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Tag } from '@/components/ui/Tag';
import { useCategories, useDeleteProduct, usePatchProduct, useProducts, type ProductFilters } from '@/lib/admin/queries';
import { errorMessage } from '@/lib/api/browser';
import type { Product } from '@/lib/api/types';
import { plural } from '@/lib/format';
import { ConfirmDialog } from './ConfirmDialog';
import { PriceInput } from './PriceInput';
import { ProductEditor } from './ProductEditor';
import { useToast } from './Toast';

const STATUS: { value: ProductFilters['status']; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'on', label: 'Na loja' },
  { value: 'off', label: 'Ocultos' },
];

const ROW = 'grid grid-cols-[56px_minmax(0,1fr)_112px_44px] items-center gap-3 wide:grid-cols-[56px_minmax(0,2.2fr)_minmax(0,1fr)_130px_110px_84px]';

export function ProductsPanel() {
  const params = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>({ q: '', cat: params.get('cat') ?? 'all', status: 'all' });
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const products = useProducts(filters);
  const categories = useCategories();
  const patch = usePatchProduct();
  const remove = useDeleteProduct();
  const toast = useToast();

  const catName = (id: string) => categories.data?.find((c) => c.id === id)?.label ?? 'Sem categoria';
  const set = (change: Partial<ProductFilters>) => setFilters((f) => ({ ...f, ...change }));
  const fail = (error: unknown) => toast(errorMessage(error), true);

  const savePrice = (p: Product, price: number) =>
    patch.mutate({ id: p.id, price }, { onSuccess: () => toast('Preço atualizado'), onError: fail });
  const toggle = (p: Product) =>
    patch.mutate({ id: p.id, active: !p.active }, {
      onSuccess: () => toast(p.active ? 'Produto ocultado da loja' : 'Produto visível na loja'),
      onError: fail,
    });
  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => { toast('Produto excluído'); setDeleting(null); },
      onError: (e) => { fail(e); setDeleting(null); },
    });
  };

  const data = products.data;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <h1 className="mb-[6px] text-[clamp(34px,4vw,48px)] tracking-[-0.02em]">Produtos</h1>
          <p className="text-base text-neutral-800">
            {data ? `${plural(data.total, 'produto', 'produtos')} · ${data.activeCount} na loja` : 'Carregando catálogo…'}
          </p>
        </div>
        <button type="button" className="btn btn-primary min-h-[46px] px-[20px] text-base" onClick={() => setEditing('new')}>
          <Plus weight="duotone" size={18} />Novo produto
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-[340px] flex-[1_1_240px]">
          <MagnifyingGlass weight="duotone" size={16} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-neutral-700" />
          <input
            type="search"
            aria-label="Buscar produto"
            placeholder="Buscar produto"
            className="input min-h-[40px] pl-[32px] text-[15px]"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>
        <select aria-label="Categoria" className="input min-h-[40px] w-auto text-[15px]" value={filters.cat} onChange={(e) => set({ cat: e.target.value })}>
          <option value="all">Todas as categorias</option>
          {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <div className="seg flex-none" role="radiogroup" aria-label="Status">
          {STATUS.map((s) => (
            <label key={s.value} className="seg-opt whitespace-nowrap px-[14px] py-[9px] text-sm">
              <input type="radio" name="status" checked={filters.status === s.value} onChange={() => set({ status: s.value })} />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className={`${ROW} hidden border-b border-divider py-[10px] text-[11px] uppercase tracking-[0.08em] text-neutral-700 wide:grid`}>
        <span /><span>Produto</span><span>Categoria</span><span>Preço</span><span>Status</span><span />
      </div>

      {data?.items.map((p) => (
        <div key={p.id} data-row className={`${ROW} border-b border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] py-[10px]`}>
          <button
            type="button"
            aria-label={`Editar ${p.name}`}
            onClick={() => setEditing(p)}
            className="bg-stripes relative h-[70px] w-[56px] overflow-hidden rounded-md"
            style={{ opacity: p.active ? 1 : 0.45 }}
          >
            {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
          </button>
          <div className="flex min-w-0 flex-col gap-1">
            <button type="button" onClick={() => setEditing(p)} className="text-left text-base font-semibold leading-tight text-text">{p.name}</button>
            <div className="flex flex-wrap items-center gap-[6px] text-[13px] text-neutral-700">
              {p.featured && <span className="inline-flex items-center gap-1 text-accent-700"><Star weight="duotone" />Destaque</span>}
              {p.tag && <Tag tone="accent-2">{p.tag}</Tag>}
              <span className="wide:hidden">{catName(p.categoryId)}</span>
            </div>
          </div>
          <span className="hidden min-w-0 text-[15px] text-neutral-800 wide:block">{catName(p.categoryId)}</span>
          <PriceInput value={p.price} label={`Preço de ${p.name}`} onCommit={(price) => savePrice(p, price)} />
          <button type="button" title="Clique para mostrar ou ocultar na loja" onClick={() => toggle(p)} className="hidden justify-self-start wide:block">
            <Tag tone={p.active ? 'accent' : 'neutral'} className="gap-[6px] px-[10px] py-[5px] text-[13px]">
              {p.active ? <Eye weight="duotone" /> : <EyeSlash weight="duotone" />}{p.active ? 'Na loja' : 'Oculto'}
            </Tag>
          </button>
          <div className="flex justify-end gap-[2px]">
            <button type="button" className="btn btn-icon btn-ghost" aria-label="Editar" onClick={() => setEditing(p)}><PencilSimple weight="duotone" size={18} /></button>
            <button type="button" className="btn btn-icon btn-ghost hidden wide:inline-flex" aria-label="Excluir" onClick={() => setDeleting(p)}><Trash weight="duotone" size={18} /></button>
          </div>
        </div>
      ))}

      {data && data.items.length === 0 && <p className="py-8 text-[17px] text-neutral-800">Nenhum produto encontrado com esses filtros.</p>}

      {deleting && (
        <ConfirmDialog
          title="Excluir produto?"
          body={`“${deleting.name}” sai do catálogo e da loja. Essa ação não pode ser desfeita.`}
          cta="Excluir produto"
          busy={remove.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          categories={categories.data ?? []}
          defaultCategoryId={filters.cat !== 'all' ? filters.cat : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
