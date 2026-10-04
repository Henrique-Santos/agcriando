import 'server-only';
import { connection } from 'next/server';
import { CATALOG_TAG } from './tags';
import type { Catalog } from './types';

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:5080';

export async function getCatalog(): Promise<Catalog> {
  // Renderiza sob demanda (o build não depende da API); os dados vêm do Data Cache até a API invalidar a tag.
  await connection();
  const response = await fetch(`${API_URL}/api/catalog`, { cache: 'force-cache', next: { tags: [CATALOG_TAG], revalidate: 300 } });
  if (!response.ok) throw new Error(`Falha ao carregar o catálogo (HTTP ${response.status}).`);
  return response.json() as Promise<Catalog>;
}
