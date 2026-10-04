import type { Catalog, Product } from '@/lib/api/types';

export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'caderno-floral',
    name: 'Caderno floral com nome',
    categoryId: 'cadernos',
    price: 69.9,
    minQuantity: null,
    productionDays: '5 a 7',
    tag: 'Mais pedido',
    description: 'Capa dura com estampa floral.',
    customFieldLabel: 'Nome na capa',
    customFieldPlaceholder: 'Ex.: Emelli',
    optionName: 'Miolo',
    optionValues: ['Pautado', 'Pontilhado', 'Sem pauta'],
    imageUrl: 'https://media.test/products/floral.webp',
    active: true,
    featured: true,
    ...overrides,
  };
}

export const catalog: Catalog = {
  categories: [
    { id: 'cadernos', label: 'Cadernos & planners' },
    { id: 'canecas', label: 'Canecas & potes' },
    { id: 'bottons', label: 'Bottons' },
    { id: 'vazia', label: 'Categoria vazia' },
  ],
  products: [
    product(),
    product({
      id: 'caneca-princesa', name: 'Caneca de porcelana ilustrada', categoryId: 'canecas', price: 39.9, tag: null,
      optionName: 'Alça', optionValues: ['Branca', 'Colorida'], customFieldLabel: 'Nome ou frase',
      imageUrl: 'https://media.test/products/caneca.webp',
    }),
    product({
      id: 'botton-jw', name: 'Botton de evento', categoryId: 'bottons', price: 4.5, minQuantity: 10, tag: 'Em quantidade',
      optionName: null, optionValues: [], customFieldLabel: 'Texto do botton', imageUrl: null, featured: false,
    }),
  ],
};
