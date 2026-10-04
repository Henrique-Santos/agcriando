import { describe, expect, it } from 'vitest';
import { isActiveLink } from './navigation';

describe('isActiveLink', () => {
  it('matches the home page exactly', () => {
    expect(isActiveLink('/', '/')).toBe(true);
    expect(isActiveLink('/', '/sobre')).toBe(false);
  });

  it('treats product and category pages as part of the catalog', () => {
    expect(isActiveLink('/catalogo', '/catalogo/bottons')).toBe(true);
    expect(isActiveLink('/catalogo', '/produto/caderno-floral')).toBe(true);
  });

  it('matches other sections by prefix', () => {
    expect(isActiveLink('/duvidas', '/duvidas')).toBe(true);
    expect(isActiveLink('/contato', '/duvidas')).toBe(false);
  });
});
