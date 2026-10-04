import { describe, expect, it } from 'vitest';
import { brl, phoneLabel, plural } from './format';

describe('format', () => {
  it('formats BRL currency like the prototype', () => {
    expect(brl(69.9)).toBe('R$ 69,90');
    expect(brl(1234.5)).toBe('R$ 1.234,50');
  });

  it('pluralizes counts', () => {
    expect(plural(1, 'produto', 'produtos')).toBe('1 produto');
    expect(plural(0, 'produto', 'produtos')).toBe('0 produtos');
    expect(plural(7, 'produto', 'produtos')).toBe('7 produtos');
  });

  it('formats the WhatsApp number for display', () => {
    expect(phoneLabel('5592995185104')).toBe('(92) 99518-5104');
  });
});
