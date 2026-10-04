import Image from 'next/image';
import Link from 'next/link';
import type { CategoryLink } from '@/lib/catalog';
import { plural } from '@/lib/format';

export function CategoryGrid({ links }: { links: CategoryLink[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-x-4 gap-y-6">
      {links.map((c) => (
        <Link key={c.id} href={`/catalogo/${c.id}`} className="flex flex-col items-center gap-2 text-center text-text no-underline hover:text-accent-700">
          <span className="bg-stripes relative block aspect-square w-full max-w-[140px] overflow-hidden rounded-full">
            {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="140px" className="object-cover" />}
          </span>
          <span className="text-base font-semibold leading-tight">{c.label}</span>
          <span className="mt-[-6px] text-[13px] text-neutral-700">{plural(c.count, 'produto', 'produtos')}</span>
        </Link>
      ))}
    </div>
  );
}
