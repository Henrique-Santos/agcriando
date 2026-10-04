import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCart } from '@/lib/cart/store';
import { catalog } from '@/test/fixtures';
import { ProductForm } from './ProductForm';

const [floral, , botton] = catalog.products;

describe('ProductForm', () => {
  beforeEach(() => useCart.setState({ items: [], customer: '', open: false }));

  it('adds the customized product to the list and clears the text fields', async () => {
    render(<ProductForm product={floral} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Pontilhado' }));
    await userEvent.type(screen.getByLabelText('Nome na capa'), 'Emelli');
    await userEvent.type(screen.getByLabelText('Tema, cores ou referências (opcional)'), 'lilás');
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar' }));
    await userEvent.click(screen.getByRole('button', { name: /Adicionar à minha lista/ }));

    expect(useCart.getState().items).toEqual([{ productId: 'caderno-floral', qty: 2, option: 'Pontilhado', text: 'Emelli', obs: 'lilás' }]);
    expect(screen.getByRole('status')).toHaveTextContent('Adicionado!');
    expect(screen.getByLabelText('Nome na capa')).toHaveValue('');
  });

  it('starts at the minimum quantity and never goes below it', async () => {
    render(<ProductForm product={botton} />);

    await userEvent.click(screen.getByRole('button', { name: 'Diminuir' }));
    await userEvent.click(screen.getByRole('button', { name: /Adicionar à minha lista/ }));

    expect(useCart.getState().items[0].qty).toBe(10);
    expect(useCart.getState().items[0].option).toBeNull();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('opens the list drawer on desktop', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('min-width: 1040px'), media: q }));
    render(<ProductForm product={floral} />);

    await userEvent.click(screen.getByRole('button', { name: /Adicionar à minha lista/ }));

    expect(useCart.getState().open).toBe(true);
  });
});
