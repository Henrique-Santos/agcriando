import { z } from 'zod';
import type { Product, ProductInput } from '../api/types';

/** Aceita "69,90", "69.9", "1.234,56" e "1.234" (milhar). Retorna NaN para texto inválido. */
export function parsePrice(raw: string): number {
  const value = raw.trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
  if (/^\d+([.,]\d{1,2})?$/.test(value)) return Number(value.replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) return Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.NaN;
}

export const TAG_OPTIONS = ['Mais pedido', 'Novo', 'Presente', 'Em quantidade', 'Promoção'];

const tooLong = (max: number) => `Use no máximo ${max} caracteres.`;

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao produto.').max(120, tooLong(120)),
  categoryId: z.string().min(1, 'Escolha uma categoria.'),
  tag: z.string(),
  description: z.string().max(1000, tooLong(1000)),
  price: z.string().refine((v) => parsePrice(v) > 0, 'Informe um preço maior que zero.'),
  minQuantity: z.string().refine((v) => v.trim() === '' || /^\d+$/.test(v.trim()), 'Informe uma quantidade mínima válida.'),
  productionDays: z.string().max(20, tooLong(20)),
  customFieldLabel: z.string().max(60, tooLong(60)),
  customFieldPlaceholder: z.string().max(120, tooLong(120)),
  optionName: z.string().max(40, tooLong(40)),
  optionValues: z.string(),
  imageUrl: z.string().nullable(),
  active: z.boolean(),
  featured: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const PRODUCT_FIELDS = Object.keys(productFormSchema.shape) as (keyof ProductFormValues)[];

export function toFormValues(product: Product | null, defaultCategoryId = ''): ProductFormValues {
  if (!product) {
    return {
      name: '', categoryId: defaultCategoryId, tag: '', description: '', price: '', minQuantity: '', productionDays: '5 a 7',
      customFieldLabel: 'Nome', customFieldPlaceholder: '', optionName: '', optionValues: '', imageUrl: null, active: true, featured: false,
    };
  }
  return {
    name: product.name,
    categoryId: product.categoryId,
    tag: product.tag ?? '',
    description: product.description,
    price: product.price.toFixed(2).replace('.', ','),
    minQuantity: product.minQuantity ? String(product.minQuantity) : '',
    productionDays: product.productionDays,
    customFieldLabel: product.customFieldLabel,
    customFieldPlaceholder: product.customFieldPlaceholder,
    optionName: product.optionName ?? '',
    optionValues: product.optionValues.join(', '),
    imageUrl: product.imageUrl,
    active: product.active,
    featured: product.featured,
  };
}

export function toProductInput(v: ProductFormValues): ProductInput {
  const min = Number.parseInt(v.minQuantity, 10);
  return {
    name: v.name.trim(),
    categoryId: v.categoryId,
    price: parsePrice(v.price),
    minQuantity: min > 1 ? min : null,
    productionDays: v.productionDays,
    tag: v.tag || null,
    description: v.description,
    customFieldLabel: v.customFieldLabel,
    customFieldPlaceholder: v.customFieldPlaceholder,
    optionName: v.optionName || null,
    optionValues: v.optionValues.split(',').map((s) => s.trim()).filter(Boolean),
    imageUrl: v.imageUrl,
    active: v.active,
    featured: v.featured,
  };
}
