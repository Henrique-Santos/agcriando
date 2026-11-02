import { describe, expect, it } from 'vitest';
import { product } from '@/test/fixtures';
import { breadcrumbJsonLd, productJsonLd, serializeJsonLd, storeJsonLd } from './seo';

const site = 'https://agcriando.test';

describe('seo helpers', () => {
  it('describes the store as a local business in Joinville/SC', () => {
    const store = storeJsonLd(site);
    expect(store).toMatchObject({
      '@type': 'Store',
      '@id': `${site}/#loja`,
      url: `${site}/`,
      address: { '@type': 'PostalAddress', addressLocality: 'Joinville', addressRegion: 'SC', addressCountry: 'BR' },
      areaServed: { '@type': 'City', name: 'Joinville' },
    });
    expect(store.sameAs).toContain('https://instagram.com/ag_criando');
    expect(store.telephone).toMatch(/^\+\d+$/);
  });

  it('builds absolute breadcrumb items in order', () => {
    expect(breadcrumbJsonLd(site, [{ name: 'Catálogo', path: '/catalogo' }, { name: 'Bottons', path: '/catalogo/bottons' }])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Catálogo', item: `${site}/catalogo` },
        { '@type': 'ListItem', position: 2, name: 'Bottons', item: `${site}/catalogo/bottons` },
      ],
    });
  });

  it('describes a product with brand, seller and offer', () => {
    const ld = productJsonLd(site, product(), 'Cadernos & planners');
    expect(ld).toMatchObject({
      '@type': 'Product',
      name: 'Caderno floral com nome',
      sku: 'caderno-floral',
      brand: { '@type': 'Brand', name: 'AG Criando Personalizados' },
      offers: { price: '69.90', priceCurrency: 'BRL', url: `${site}/produto/caderno-floral`, seller: { '@id': `${site}/#loja` } },
    });
  });

  it('escapes < so the payload cannot close the script tag', () => {
    expect(serializeJsonLd({ name: '</script><b>' })).toBe('{"name":"\\u003c/script>\\u003cb>"}');
  });
});
