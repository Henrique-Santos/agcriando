import { WHATSAPP } from './config';
import { brl } from './format';

export type OrderLine = {
  name: string;
  qty: number;
  unitPrice: number;
  optionName: string | null;
  option: string | null;
  fieldLabel: string;
  text: string;
  obs: string;
};

export const GENERIC_MESSAGE = 'Olá, AG Criando! Vim pelo site e gostaria de mais informações.';

export function buildOrderMessage(lines: OrderLine[], customer = ''): string {
  const items = lines.map((l, i) =>
    `${i + 1}. ${l.name} — ${l.qty} un. (${brl(l.unitPrice * l.qty)})` +
    (l.option ? `\n   ${l.optionName}: ${l.option}` : '') +
    (l.text ? `\n   ${l.fieldLabel}: ${l.text}` : '') +
    (l.obs ? `\n   Referências: ${l.obs}` : ''));
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const name = customer.trim();

  return `Olá, AG Criando! Gostaria de fazer um pedido:\n\n${items.join('\n\n')}\n\nTotal estimado: ${brl(total)}` +
    (name ? `\n\nMeu nome: ${name}` : '');
}

export function buildContactMessage({ name, subject, message }: { name: string; subject: string; message: string }): string {
  const who = name.trim() ? ` Aqui é ${name.trim()}.` : '';
  return `Olá, AG Criando!${who}\nAssunto: ${subject}\n\n${message}`;
}

export const waLink = (text: string, phone = WHATSAPP) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
