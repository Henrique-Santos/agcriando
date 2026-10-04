import { describe, expect, it } from 'vitest';
import { parsePrice } from './product-form';

describe('parsePrice', () => {
  it.each([
    ['69,90', 69.9], ['69.9', 69.9], ['45', 45], ['1.234,56', 1234.56], ['1.234', 1234], [' R$ 12,5 ', 12.5],
  ])('parses %s', (raw, expected) => expect(parsePrice(raw)).toBe(expected));

  it.each(['', 'abc', '12,345', '1,2,3', '-5'])('rejects %s', (raw) => expect(parsePrice(raw)).toBeNaN());
});
