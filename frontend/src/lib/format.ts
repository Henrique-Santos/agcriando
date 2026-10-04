const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const brl = (value: number) => currency.format(value);

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function phoneLabel(digits: string) {
  const local = digits.replace(/\D/g, '').replace(/^55/, '');
  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
}
