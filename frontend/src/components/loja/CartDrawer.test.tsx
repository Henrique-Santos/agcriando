import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCart } from '@/lib/cart/store';
import { catalog } from '@/test/fixtures';
import { CartDrawer } from './CartDrawer';
import { CatalogProvider } from './CatalogProvider';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const renderDrawer = () => render(<CatalogProvider catalog={catalog}><CartDrawer /></CatalogProvider>);

describe('CartDrawer', () => {
  beforeEach(() => useCart.setState({ items: [], customer: '', open: true }));

  it('shows the empty state', () => {
    renderDrawer();
    expect(screen.getByText('Sua lista ainda está vazia.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/catalogo');
  });

  it('lists items with customization, subtotal and total', async () => {
    useCart.setState({ items: [{ productId: 'caderno-floral', qty: 2, option: 'Pontilhado', text: 'Emelli', obs: '' }] });
    renderDrawer();

    expect(await screen.findByText('Caderno floral com nome')).toBeInTheDocument();
    expect(screen.getByText('Pontilhado · “Emelli”')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 139,80')).toHaveLength(2);
  });

  it('respects the minimum quantity when decrementing', async () => {
    useCart.setState({ items: [{ productId: 'botton-jw', qty: 10, option: null, text: '', obs: '' }] });
    renderDrawer();

    await userEvent.click(await screen.findByRole('button', { name: 'Diminuir' }));

    expect(useCart.getState().items[0].qty).toBe(10);
  });

  it('opens WhatsApp with the order message and the customer name', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    useCart.setState({ items: [{ productId: 'caneca-princesa', qty: 1, option: 'Branca', text: 'Sofia', obs: '' }] });
    renderDrawer();

    await userEvent.type(await screen.findByLabelText('Seu nome'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: /Enviar pedido pelo WhatsApp/ }));

    const url = new URL(open.mock.calls[0][0]);
    const text = url.searchParams.get('text')!;
    expect(text).toContain('1. Caneca de porcelana ilustrada — 1 un.');
    expect(text).toContain('Alça: Branca');
    expect(text).toContain('Meu nome: Ana');
    expect(open.mock.calls[0][1]).toBe('_blank');
  });

  it('drops items of products that left the catalog when the saved list is restored', async () => {
    localStorage.setItem('agc-cart', JSON.stringify({
      state: { items: [
        { productId: 'removido', qty: 1, option: null, text: '', obs: '' },
        { productId: 'caderno-floral', qty: 1, option: 'Pautado', text: '', obs: '' },
      ], customer: '' },
      version: 0,
    }));
    renderDrawer();

    await waitFor(() => expect(useCart.getState().items.map((i) => i.productId)).toEqual(['caderno-floral']));
    expect(screen.getByText('Caderno floral com nome')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    renderDrawer();
    await userEvent.keyboard('{Escape}');
    expect(useCart.getState().open).toBe(false);
  });
});
