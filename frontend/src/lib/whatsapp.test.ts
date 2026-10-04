import { describe, expect, it } from 'vitest';
import { buildContactMessage, buildOrderMessage, GENERIC_MESSAGE, waLink, type OrderLine } from './whatsapp';

const floral: OrderLine = {
  name: 'Caderno floral com nome', qty: 2, unitPrice: 69.9, optionName: 'Miolo', option: 'Pontilhado',
  fieldLabel: 'Nome na capa', text: 'Emelli', obs: 'tons de lilás',
};
const botton: OrderLine = {
  name: 'Botton de evento', qty: 10, unitPrice: 4.5, optionName: null, option: null,
  fieldLabel: 'Texto do botton', text: '', obs: '',
};

describe('buildOrderMessage', () => {
  it('matches the prototype format', () => {
    expect(buildOrderMessage([floral, botton], 'Ana')).toBe([
      'Olá, AG Criando! Gostaria de fazer um pedido:',
      '',
      '1. Caderno floral com nome — 2 un. (R$ 139,80)',
      '   Miolo: Pontilhado',
      '   Nome na capa: Emelli',
      '   Referências: tons de lilás',
      '',
      '2. Botton de evento — 10 un. (R$ 45,00)',
      '',
      'Total estimado: R$ 184,80',
      '',
      'Meu nome: Ana',
    ].join('\n'));
  });

  it('omits the customer line when no name was given', () => {
    expect(buildOrderMessage([botton], '   ')).not.toContain('Meu nome');
  });
});

describe('buildContactMessage', () => {
  it('includes name, subject and message', () => {
    expect(buildContactMessage({ name: 'Ana', subject: 'Orçamento', message: 'Quero 30 bottons.' }))
      .toBe('Olá, AG Criando! Aqui é Ana.\nAssunto: Orçamento\n\nQuero 30 bottons.');
  });

  it('skips the greeting name when empty', () => {
    expect(buildContactMessage({ name: '', subject: 'Outro assunto', message: 'Oi' }))
      .toBe('Olá, AG Criando!\nAssunto: Outro assunto\n\nOi');
  });
});

describe('waLink', () => {
  it('encodes special characters, emoji and line breaks so the message arrives intact', () => {
    const text = 'Tema: R&B #1? 🎉\nLinha 2';
    const url = new URL(waLink(text, '5592995185104'));
    expect(url.origin + url.pathname).toBe('https://wa.me/5592995185104');
    expect(url.searchParams.get('text')).toBe(text);
  });

  it('has a generic first-contact message', () => {
    expect(GENERIC_MESSAGE).toBe('Olá, AG Criando! Vim pelo site e gostaria de mais informações.');
  });
});
