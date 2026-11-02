import type { Product } from './api/types';
import { INSTAGRAM_URL, STORE, WHATSAPP } from './config';

const absolute = (site: string, path: string) => `${site}${path}`;
const storeId = (site: string) => absolute(site, '/#loja');

/** Loja física/atendimento local — base do SEO local (Google Business, buscas "em Joinville"). */
export function storeJsonLd(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': storeId(site),
    name: STORE.name,
    description: STORE.description,
    url: absolute(site, '/'),
    logo: absolute(site, '/img/logo.png'),
    image: absolute(site, '/img/logo.png'),
    telephone: `+${WHATSAPP}`,
    priceRange: '$',
    currenciesAccepted: 'BRL',
    paymentAccepted: 'Pix, cartão de crédito',
    address: {
      '@type': 'PostalAddress',
      addressLocality: STORE.city,
      addressRegion: STORE.state,
      addressCountry: 'BR',
    },
    areaServed: { '@type': 'City', name: STORE.city },
    sameAs: [INSTAGRAM_URL],
  };
}

export function breadcrumbJsonLd(site: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absolute(site, it.path) })),
  };
}

export function productJsonLd(site: string, product: Product, categoryLabel: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl ?? undefined,
    sku: product.id,
    category: categoryLabel,
    brand: { '@type': 'Brand', name: STORE.name },
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: absolute(site, `/produto/${product.id}`),
      seller: { '@id': storeId(site) },
    },
  };
}

/** JSON.stringify não escapa `<`; sem isso um texto com `</script>` fecharia a tag. */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
