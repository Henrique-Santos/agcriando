import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { catalog } from '@/test/fixtures';
import { CategoryGrid } from './CategoryGrid';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('links to the product page and shows tag, category and price', () => {
    render(<ProductCard product={catalog.products[0]} categoryLabel="Cadernos & planners" />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/produto/caderno-floral');
    expect(screen.getByText('Mais pedido')).toHaveClass('tag-accent-2');
    expect(screen.getByText('Cadernos & planners')).toBeInTheDocument();
    expect(screen.getByText('R$ 69,90')).toBeInTheDocument();
    expect(screen.getByAltText('Caderno floral com nome')).toBeInTheDocument();
  });

  it('shows the placeholder and per-unit price for products without photo and with minimum', () => {
    render(<ProductCard product={catalog.products[2]} />);

    expect(screen.getByText('foto do produto')).toBeInTheDocument();
    expect(screen.getByText('R$ 4,50 / un.')).toBeInTheDocument();
  });
});

describe('CategoryGrid', () => {
  it('links each category with its product count', () => {
    render(<CategoryGrid links={[{ id: 'bottons', label: 'Bottons', imageUrl: null, count: 3 }]} />);

    expect(screen.getByRole('link', { name: /Bottons/ })).toHaveAttribute('href', '/catalogo/bottons');
    expect(screen.getByText('3 produtos')).toBeInTheDocument();
  });
});
