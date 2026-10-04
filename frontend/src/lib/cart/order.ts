import type { Product } from '../api/types';
import type { OrderLine } from '../whatsapp';
import type { CartItem } from './store';

export type CartLine = { index: number; item: CartItem; product: Product };

export const cartLines = (items: CartItem[], products: ReadonlyMap<string, Product>): CartLine[] =>
  items.flatMap((item, index) => {
    const product = products.get(item.productId);
    return product ? [{ index, item, product }] : [];
  });

export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.product.price * l.item.qty, 0);

export const toOrderLines = (lines: CartLine[]): OrderLine[] =>
  lines.map(({ item, product }) => ({
    name: product.name,
    qty: item.qty,
    unitPrice: product.price,
    optionName: product.optionName,
    option: item.option,
    fieldLabel: product.customFieldLabel,
    text: item.text,
    obs: item.obs,
  }));

export const lineDetail = ({ item }: CartLine) =>
  [item.option, item.text && `“${item.text}”`, item.obs].filter(Boolean).join(' · ');
