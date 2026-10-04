import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalog } from '@/test/fixtures';
import { CatalogBrowser } from './CatalogBrowser';

const replace = vi.fn();
let search = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/catalogo',
  useSearchParams: () => search,
}));

const names = () => screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/produto/'))
  .map((a) => within(a).getByText(/./, { selector: 'span.text-lg' }).textContent);

describe('CatalogBrowser', () => {
  beforeEach(() => { replace.mockClear(); search = new URLSearchParams(); });

  it('shows all products with category chips', () => {
    render(<CatalogBrowser catalog={catalog} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Catálogo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Todos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Bottons' })).toHaveAttribute('href', '/catalogo/bottons');
    expect(screen.getByText('3 produtos')).toBeInTheDocument();
  });

  it('filters by category and uses its label as title', () => {
    render(<CatalogBrowser catalog={catalog} categoryId="canecas" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Canecas & potes' })).toBeInTheDocument();
    expect(names()).toEqual(['Caneca de porcelana ilustrada']);
  });

  it('searches and keeps the query in the URL', async () => {
    render(<CatalogBrowser catalog={catalog} />);

    await userEvent.type(screen.getByPlaceholderText('Buscar produto'), 'botton');

    expect(names()).toEqual(['Botton de evento']);
    expect(replace).toHaveBeenLastCalledWith('/catalogo?q=botton', { scroll: false });
  });

  it('sorts by price', async () => {
    render(<CatalogBrowser catalog={catalog} />);

    await userEvent.selectOptions(screen.getByLabelText('Ordenar'), 'menor');

    expect(names()).toEqual(['Botton de evento', 'Caneca de porcelana ilustrada', 'Caderno floral com nome']);
    expect(replace).toHaveBeenLastCalledWith('/catalogo?ordem=menor', { scroll: false });
  });

  it('reads initial search and sort from the URL', () => {
    search = new URLSearchParams('q=caderno&ordem=maior');
    render(<CatalogBrowser catalog={catalog} />);

    expect(screen.getByPlaceholderText('Buscar produto')).toHaveValue('caderno');
    expect(names()).toEqual(['Caderno floral com nome']);
  });

  it('suggests WhatsApp when nothing matches', async () => {
    render(<CatalogBrowser catalog={catalog} />);
    await userEvent.type(screen.getByPlaceholderText('Buscar produto'), 'xyz');

    expect(screen.getByText(/Nenhum produto encontrado/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pergunte pelo WhatsApp' })).toHaveAttribute('href', expect.stringContaining('https://wa.me/'));
  });
});
