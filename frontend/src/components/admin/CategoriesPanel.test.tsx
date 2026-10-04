import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminCategory } from '@/lib/api/types';
import { mockFetch, type FetchCall } from '@/test/fetch-mock';
import { renderWithQuery } from '@/test/render';
import { CategoriesPanel } from './CategoriesPanel';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const categories: AdminCategory[] = [
  { id: 'cadernos', label: 'Cadernos', sortOrder: 0, productCount: 7 },
  { id: 'bottons', label: 'Bottons', sortOrder: 1, productCount: 0 },
];

const backend = (extra?: (c: FetchCall) => { status?: number; json?: unknown } | undefined) =>
  mockFetch((c) => extra?.(c) ?? (c.url === '/api/admin/categories' && c.method === 'GET' ? { json: categories } : undefined));

const row = async (label: string) => (await screen.findByDisplayValue(label)).closest('[data-row]') as HTMLElement;

describe('CategoriesPanel', () => {
  it('adds a category', async () => {
    const { calls } = backend((c) => (c.method === 'POST' ? { status: 201, json: { id: 'canecas', label: 'Canecas', sortOrder: 2, productCount: 0 } } : undefined));
    renderWithQuery(<CategoriesPanel />);

    await userEvent.type(await screen.findByPlaceholderText('Nome da nova categoria'), 'Canecas');
    await userEvent.click(screen.getByRole('button', { name: /Adicionar categoria/ }));

    await waitFor(() => expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ label: 'Canecas' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Categoria adicionada');
  });

  it('shows the duplicate-name error from the API', async () => {
    backend((c) => (c.method === 'POST' ? { status: 400, json: { title: 'x', errors: { label: ['Já existe uma categoria com esse nome.'] } } } : undefined));
    renderWithQuery(<CategoriesPanel />);

    await userEvent.type(await screen.findByPlaceholderText('Nome da nova categoria'), 'bottons');
    await userEvent.click(screen.getByRole('button', { name: /Adicionar categoria/ }));

    expect(await screen.findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument();
  });

  it('renames when leaving the field', async () => {
    const { calls } = backend((c) => (c.method === 'PUT' ? { json: { ...categories[1], label: 'Bottons & broches' } } : undefined));
    renderWithQuery(<CategoriesPanel />);

    const input = within(await row('Bottons')).getByRole('textbox', { name: 'Nome da categoria' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Bottons & broches');
    await userEvent.tab();

    await waitFor(() => expect(calls.find((c) => c.method === 'PUT')).toMatchObject({ url: '/api/admin/categories/bottons', body: { label: 'Bottons & broches' } }));
  });

  it('moves a category down', async () => {
    const { calls } = backend((c) => (c.url === '/api/admin/categories/order' ? { status: 204 } : undefined));
    renderWithQuery(<CategoriesPanel />);

    await userEvent.click(within(await row('Cadernos')).getByRole('button', { name: 'Descer' }));

    await waitFor(() => expect(calls.find((c) => c.url === '/api/admin/categories/order')?.body).toEqual({ ids: ['bottons', 'cadernos'] }));
  });

  it('only allows deleting empty categories, after confirmation', async () => {
    const { calls } = backend((c) => (c.method === 'DELETE' ? { status: 204 } : undefined));
    renderWithQuery(<CategoriesPanel />);

    expect(within(await row('Cadernos')).getByRole('button', { name: 'Excluir' })).toBeDisabled();
    await userEvent.click(within(await row('Bottons')).getByRole('button', { name: 'Excluir' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir categoria' }));

    await waitFor(() => expect(calls.find((c) => c.method === 'DELETE')?.url).toBe('/api/admin/categories/bottons'));
  });

  it('opens the products filtered by category', async () => {
    backend();
    renderWithQuery(<CategoriesPanel />);

    await userEvent.click(within(await row('Cadernos')).getByRole('button', { name: '7 produtos' }));

    expect(push).toHaveBeenCalledWith('/admin/produtos?cat=cadernos');
  });
});
