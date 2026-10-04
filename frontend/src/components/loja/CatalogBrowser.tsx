'use client';

import { MagnifyingGlass } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { chipClass } from '@/components/ui/chip';
import type { Catalog } from '@/lib/api/types';
import { categoryLabel, filterProducts, parseSort, SORT_OPTIONS, type SortOrder } from '@/lib/catalog';
import { plural } from '@/lib/format';
import { GENERIC_MESSAGE, waLink } from '@/lib/whatsapp';
import { ProductCard } from './ProductCard';
import { ProductGrid } from './ProductGrid';

export function CatalogBrowser({ catalog, categoryId }: { catalog: Catalog; categoryId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState<SortOrder>(parseSort(params.get('ordem')));

  const syncUrl = (q: string, s: SortOrder) => {
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (s !== 'rel') next.set('ordem', s);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const results = filterProducts(catalog, { categoryId, query, sort });
  const chips = [{ id: undefined, label: 'Todos' }, ...catalog.categories.map((c) => ({ id: c.id, label: c.label }))];

  return (
    <section className="pb-24 pt-8">
      <h1 className="mb-2 text-[clamp(40px,6vw,68px)] tracking-[-0.03em]">{categoryId ? categoryLabel(catalog, categoryId) : 'Catálogo'}</h1>
      <p className="mb-6 max-w-[560px] text-[17px] text-neutral-800">
        Escolha, personalize e adicione à sua lista. No final, você envia tudo de uma vez pelo WhatsApp.
      </p>

      <nav aria-label="Categorias" className="mb-4 flex flex-wrap gap-2">
        {chips.map((chip) => {
          const selected = chip.id === categoryId;
          return (
            <Link
              key={chip.id ?? 'todos'}
              href={chip.id ? `/catalogo/${chip.id}` : '/catalogo'}
              aria-current={selected ? 'page' : undefined}
              className={chipClass(selected)}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-[360px] flex-[1_1_240px]">
          <MagnifyingGlass weight="duotone" size={16} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-neutral-700" />
          <input
            type="search"
            className="input pl-[32px]"
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            value={query}
            onChange={(e) => { setQuery(e.target.value); syncUrl(e.target.value, sort); }}
          />
        </div>
        <select
          className="input w-auto"
          aria-label="Ordenar"
          value={sort}
          onChange={(e) => { const s = parseSort(e.target.value); setSort(s); syncUrl(query, s); }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="ml-auto text-sm text-neutral-700">{plural(results.length, 'produto', 'produtos')}</span>
      </div>

      <ProductGrid>
        {results.map((p) => <ProductCard key={p.id} product={p} categoryLabel={categoryLabel(catalog, p.categoryId)} />)}
      </ProductGrid>

      {results.length === 0 && (
        <p className="py-8 text-lg text-neutral-800">
          Nenhum produto encontrado. Não achou o que procura?{' '}
          <a href={waLink(GENERIC_MESSAGE)} target="_blank" rel="noopener noreferrer">Pergunte pelo WhatsApp</a>
          {' '}— quase tudo pode ser personalizado.
        </p>
      )}
    </section>
  );
}
