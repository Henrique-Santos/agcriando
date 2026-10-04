/** Aceita "69,90", "69.9", "1.234,56" e "1.234" (milhar). Retorna NaN para texto inválido. */
export function parsePrice(raw: string): number {
  const value = raw.trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
  if (/^\d+([.,]\d{1,2})?$/.test(value)) return Number(value.replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) return Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.NaN;
}
