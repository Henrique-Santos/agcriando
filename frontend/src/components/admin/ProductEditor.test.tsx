import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { catalog } from '@/test/fixtures';
import { mockFetch } from '@/test/fetch-mock';
import { renderWithQuery } from '@/test/render';
import { ProductEditor } from './ProductEditor';

const categories = catalog.categories.map((c, i) => ({ ...c, sortOrder: i, productCount: 1 }));

describe('ProductEditor', () => {
  it('validates locally before calling the API', async () => {
    const { calls } = mockFetch(() => undefined);
    renderWithQuery(<ProductEditor product={null} categories={categories} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Dê um nome ao produto.')).toBeInTheDocument();
    expect(screen.getByText('Escolha uma categoria.')).toBeInTheDocument();
    expect(screen.getByText('Informe um preço maior que zero.')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('creates a product with price typed using comma', async () => {
    const onClose = vi.fn();
    const { calls } = mockFetch((c) => (c.method === 'POST' ? { status: 201, json: catalog.products[1] } : undefined));
    renderWithQuery(<ProductEditor product={null} categories={categories} defaultCategoryId="canecas" onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Nome do produto *'), 'Caneca nova');
    await userEvent.type(screen.getByLabelText('Preço por unidade *'), '45,90');
    await userEvent.type(screen.getByLabelText('Escolhas, separadas por vírgula'), 'Branca, Colorida');
    await userEvent.type(screen.getByLabelText('Nome da opção'), 'Alça');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(calls[0]).toMatchObject({
      url: '/api/admin/products', method: 'POST',
      body: { name: 'Caneca nova', categoryId: 'canecas', price: 45.9, optionName: 'Alça', optionValues: ['Branca', 'Colorida'], active: true },
    });
  });

  it('shows field errors returned by the API next to the field', async () => {
    mockFetch((c) => (c.method === 'PUT'
      ? { status: 400, json: { title: 'Confira os campos destacados.', errors: { categoryId: ['Categoria não encontrada.'] } } }
      : undefined));
    renderWithQuery(<ProductEditor product={catalog.products[0]} categories={categories} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(await screen.findByText('Categoria não encontrada.')).toBeInTheDocument();
  });

  it('uploads a photo and shows the preview', async () => {
    const { calls } = mockFetch((c) => (c.url === '/api/admin/uploads' ? { json: { url: 'https://media.test/products/nova.webp' } } : undefined));
    renderWithQuery(<ProductEditor product={null} categories={categories} onClose={vi.fn()} />);

    const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('Enviar foto'), file);

    expect(await screen.findByRole('img', { name: 'Foto do produto' })).toBeInTheDocument();
    expect(calls[0].body).toBeInstanceOf(FormData);
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeInTheDocument();
  });

  it('shows the upload error message from the API', async () => {
    mockFetch(() => ({ status: 400, json: { title: 'Confira os campos destacados.', errors: { file: ['Não foi possível ler a imagem.'] } } }));
    renderWithQuery(<ProductEditor product={null} categories={categories} onClose={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText('Enviar foto'), new File(['x'], 'x.jpg', { type: 'image/jpeg' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Não foi possível ler a imagem.');
  });
});
