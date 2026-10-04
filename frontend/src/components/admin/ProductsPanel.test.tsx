import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductList } from '@/lib/api/types';
import { catalog } from '@/test/fixtures';
import { mockFetch, type FetchCall } from '@/test/fetch-mock';
import { renderWithQuery } from '@/test/render';
import { ProductsPanel } from './ProductsPanel';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));

const list: ProductList = { items: catalog.products, total: 3, activeCount: 3 };
const categories = catalog.categories.map((c, i) => ({ ...c, sortOrder: i, productCount: 1 }));

function backend(extra?: (call: FetchCall) => { status?: number; json?: unknown } | undefined) {
  return mockFetch((call) => {
    const custom = extra?.(call);
    if (custom) return custom;
    if (call.url.startsWith('/api/admin/products?')) return { json: list };
    if (call.url === '/api/admin/categories') return { json: categories };
    return undefined;
  });
}

describe('ProductsPanel', () => {
  beforeEach(() => vi.useRealTimers());

  it('lists products with category, summary and status', async () => {
    backend();
    renderWithQuery(<ProductsPanel />);

    expect(await screen.findByText('Caderno floral com nome')).toBeInTheDocument();
    expect(screen.getByText('3 produtos · 3 na loja')).toBeInTheDocument();
    expect(screen.getAllByText('Cadernos & planners').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Na loja/ })).toHaveLength(3);
  });

  it('saves a price typed with comma when leaving the field', async () => {
    const { calls } = backend((c) => (c.method === 'PATCH' ? { json: { ...catalog.products[0], price: 45.9 } } : undefined));
    renderWithQuery(<ProductsPanel />);

    const input = await screen.findByRole('textbox', { name: 'Preço de Caderno floral com nome' });
    await userEvent.clear(input);
    await userEvent.type(input, '45,90');
    await userEvent.tab();

    await waitFor(() => expect(calls.find((c) => c.method === 'PATCH')).toMatchObject({
      url: '/api/admin/products/caderno-floral', body: { price: 45.9 },
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('Preço atualizado');
  });

  it('does not save an invalid price and restores the old value', async () => {
    const { calls } = backend();
    renderWithQuery(<ProductsPanel />);

    const input = await screen.findByRole('textbox', { name: 'Preço de Caderno floral com nome' });
    await userEvent.clear(input);
    await userEvent.type(input, 'abc');
    await userEvent.tab();

    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
    expect(input).toHaveValue('69,90');
  });

  it('hides a product from the store', async () => {
    const { calls } = backend((c) => (c.method === 'PATCH' ? { json: { ...catalog.products[0], active: false } } : undefined));
    renderWithQuery(<ProductsPanel />);

    const row = (await screen.findByText('Caderno floral com nome')).closest('[data-row]') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /Na loja/ }));

    await waitFor(() => expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ active: false }));
    expect(await screen.findByRole('status')).toHaveTextContent('Produto ocultado da loja');
  });

  it('asks for confirmation before deleting', async () => {
    const { calls } = backend((c) => (c.method === 'DELETE' ? { status: 204 } : undefined));
    renderWithQuery(<ProductsPanel />);

    const row = (await screen.findByText('Caderno floral com nome')).closest('[data-row]') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Excluir' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('“Caderno floral com nome” sai do catálogo e da loja.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Excluir produto' }));

    await waitFor(() => expect(calls.find((c) => c.method === 'DELETE')?.url).toBe('/api/admin/products/caderno-floral'));
    expect(await screen.findByRole('status')).toHaveTextContent('Produto excluído');
  });

  it('filters by status', async () => {
    const { calls } = backend();
    renderWithQuery(<ProductsPanel />);
    await screen.findByText('Caderno floral com nome');

    await userEvent.click(screen.getByRole('radio', { name: 'Ocultos' }));

    await waitFor(() => expect(calls.some((c) => c.url.includes('status=off'))).toBe(true));
  });

  it('shows an error with retry when the list fails to load', async () => {
    let fail = true;
    const { calls } = backend((c) => (c.url.startsWith('/api/admin/products?') && fail ? { status: 500, json: { title: 'Erro interno' } } : undefined));
    renderWithQuery(<ProductsPanel />);

    expect(await screen.findByText('Não foi possível carregar os produtos.')).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Caderno floral com nome')).toBeInTheDocument();
    expect(calls.filter((c) => c.url.startsWith('/api/admin/products?')).length).toBeGreaterThan(1);
  });
});
