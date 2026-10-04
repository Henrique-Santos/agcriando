'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Catalog, Product } from '@/lib/api/types';
import { useCart } from '@/lib/cart/store';

type CatalogContextValue = { catalog: Catalog; productsById: ReadonlyMap<string, Product> };

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  const value = useMemo(() => ({ catalog, productsById: new Map(catalog.products.map((p) => [p.id, p])) }), [catalog]);

  useEffect(() => {
    // A lista salva pode conter produtos que foram excluídos ou ocultados desde a última visita.
    void Promise.resolve(useCart.persist.rehydrate()).then(() =>
      useCart.getState().prune(new Set(value.productsById.keys())));
  }, [value]);

  return <CatalogContext value={value}>{children}</CatalogContext>;
}

export function useCatalog(): CatalogContextValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalog precisa estar dentro de <CatalogProvider>.');
  return value;
}
