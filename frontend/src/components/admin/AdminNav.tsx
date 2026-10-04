'use client';

import { Package, Tag as TagIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCategories, useProducts } from '@/lib/admin/queries';
import { cn } from '@/lib/cn';

export function AdminNav() {
  const pathname = usePathname();
  const products = useProducts({ q: '', cat: 'all', status: 'all' });
  const categories = useCategories();
  const items = [
    { href: '/admin/produtos', label: 'Produtos', icon: Package, count: products.data?.total },
    { href: '/admin/categorias', label: 'Categorias', icon: TagIcon, count: categories.data?.length },
  ];

  return (
    <nav aria-label="Painel" className="flex w-full gap-1 overflow-x-auto pt-3 wide:sticky wide:top-[88px] wide:w-[200px] wide:flex-none wide:flex-col wide:pt-6">
      {items.map(({ href, label, icon: Icon, count }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-[10px] whitespace-nowrap rounded-md px-[12px] py-[10px] text-base no-underline',
              active ? 'bg-accent-100 text-accent-800 hover:text-accent-800' : 'text-text hover:text-text',
            )}
          >
            <Icon weight="duotone" size={20} />
            <span className="mr-auto">{label}</span>
            <span className="text-[13px] opacity-75">{count ?? ''}</span>
          </Link>
        );
      })}
    </nav>
  );
}
