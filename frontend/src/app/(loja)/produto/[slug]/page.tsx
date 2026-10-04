import { Clock, WhatsappLogo } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/loja/ProductCard';
import { ProductForm } from '@/components/loja/ProductForm';
import { ProductGrid } from '@/components/loja/ProductGrid';
import { NoPhoto } from '@/components/ui/NoPhoto';
import { getCatalog } from '@/lib/api/server';
import { categoryLabel, priceLabel, relatedProducts } from '@/lib/catalog';
import { SITE_URL } from '@/lib/config';
import { brl } from '@/lib/format';

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const catalog = await getCatalog();
  return { catalog, product: catalog.products.find((p) => p.id === slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await load(slug);
  if (!product) return { title: 'Produto não encontrado' };

  const description = `${priceLabel(product)} · ${product.description}`.slice(0, 200);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produto/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      url: `/produto/${product.id}`,
      images: [{ url: product.imageUrl ?? '/img/logo.png', alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { catalog, product } = await load(slug);
  if (!product) notFound();

  const label = categoryLabel(catalog, product.categoryId);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl ?? undefined,
    category: label,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/produto/${product.id}`,
    },
  };

  return (
    <section className="pb-24 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-sm text-neutral-700">
        <Link href="/catalogo">Catálogo</Link>
        <span>/</span>
        <Link href={`/catalogo/${product.categoryId}`}>{label}</Link>
      </nav>

      <div className="flex flex-wrap items-start gap-x-[56px] gap-y-8">
        <div className="relative aspect-[4/5] min-w-0 max-w-[600px] flex-[1_1_380px] overflow-hidden rounded-md bg-surface">
          {product.imageUrl
            ? <Image src={product.imageUrl} alt={product.name} fill priority sizes="(min-width: 1040px) 600px, 100vw" className="object-cover" />
            : <NoPhoto />}
        </div>
        <div className="flex min-w-0 max-w-[520px] flex-[1_1_360px] flex-col gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-accent-700">{label}</p>
            <h1 className="mb-3 text-[clamp(34px,4.4vw,52px)] tracking-[-0.025em]">{product.name}</h1>
            <p className="text-2xl">{brl(product.price)}<span className="text-[15px] text-neutral-700"> por unidade</span></p>
            {product.minQuantity && <p className="mt-[6px] text-sm text-accent-2-700">Pedido mínimo: {product.minQuantity} unidades</p>}
          </div>
          <p className="text-pretty text-[17px] leading-[1.6]">{product.description}</p>
          <ProductForm key={product.id} product={product} />
          <div className="flex flex-col gap-2 pt-2 text-sm text-neutral-800">
            <span className="flex items-center gap-2"><Clock weight="duotone" size={18} className="text-accent" />Produção em {product.productionDays} dias úteis</span>
            <span className="flex items-center gap-2"><WhatsappLogo weight="duotone" size={18} className="text-accent" />Arte, pagamento e entrega combinados pelo WhatsApp</span>
          </div>
        </div>
      </div>

      <h2 className="mb-6 mt-[88px] text-[clamp(26px,3vw,34px)]">Você também pode gostar</h2>
      <ProductGrid>
        {relatedProducts(catalog, product).map((p) => <ProductCard key={p.id} product={p} />)}
      </ProductGrid>
    </section>
  );
}
