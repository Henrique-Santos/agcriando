import { describe, expect, it } from 'vitest';
import { parsePrice, productFormSchema, toFormValues, toProductInput } from './product-form';
import { product } from '@/test/fixtures';

describe('parsePrice', () => {
  it.each([
    ['69,90', 69.9], ['69.9', 69.9], ['45', 45], ['1.234,56', 1234.56], ['1.234', 1234], [' R$ 12,5 ', 12.5],
  ])('parses %s', (raw, expected) => expect(parsePrice(raw)).toBe(expected));

  it.each(['', 'abc', '12,345', '1,2,3', '-5'])('rejects %s', (raw) => expect(parsePrice(raw)).toBeNaN());
});

describe('product form conversions', () => {
  it('round-trips a product through the form', () => {
    const values = toFormValues(product({ minQuantity: 10 }));
    expect(values.price).toBe('69,90');
    expect(values.optionValues).toBe('Pautado, Pontilhado, Sem pauta');
    expect(values.minQuantity).toBe('10');

    expect(toProductInput({ ...values, price: '1.234,56', optionValues: ' A5, A4 ,, ', minQuantity: '1', tag: '' })).toMatchObject({
      price: 1234.56, optionValues: ['A5', 'A4'], minQuantity: null, tag: null,
    });
  });

  it('starts new products with defaults and the chosen category', () => {
    expect(toFormValues(null, 'canecas')).toMatchObject({ categoryId: 'canecas', productionDays: '5 a 7', active: true, featured: false, imageUrl: null });
  });

  it('validates with the same messages as the API', () => {
    const result = productFormSchema.safeParse({ ...toFormValues(null), name: ' ', price: 'abc' });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message);
    expect(messages).toEqual(expect.arrayContaining(['Dê um nome ao produto.', 'Escolha uma categoria.', 'Informe um preço maior que zero.']));
  });
});
