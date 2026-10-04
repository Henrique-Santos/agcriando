import Image from 'next/image';
import Link from 'next/link';
import { NoPhoto } from '@/components/ui/NoPhoto';
import { Tag } from '@/components/ui/Tag';
import type { Product } from '@/lib/api/types';
import { priceLabel } from '@/lib/catalog';

export function ProductCard({ product, categoryLabel }: { product: Product; categoryLabel?: string }) {
  return (
    <Link href={`/produto/${product.id}`} className="group flex min-w-0 flex-col gap-2 text-text no-underline hover:text-text">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-surface">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 700px) 300px, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <NoPhoto small />
        )}
        {product.tag && <Tag tone="accent-2" className="absolute left-[10px] top-[10px]">{product.tag}</Tag>}
      </div>
      {categoryLabel && <span className="text-[11px] uppercase tracking-[0.1em] text-accent-700">{categoryLabel}</span>}
      <span className="text-lg font-semibold leading-tight">{product.name}</span>
      <span className="text-[15px] text-neutral-800">{priceLabel(product)}</span>
    </Link>
  );
}
