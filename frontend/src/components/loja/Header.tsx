'use client';

import { List, ShoppingBagOpen, X } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cartCount, useCart } from '@/lib/cart/store';
import { cn } from '@/lib/cn';
import { isActiveLink, NAV_LINKS } from '@/lib/navigation';

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart((s) => cartCount(s.items));
  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-20 bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] backdrop-blur-[8px]">
      <nav className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-2" aria-label="Principal">
        <Link href="/" onClick={close} className="mr-auto flex items-center gap-2 text-text hover:text-text">
          <Image src="/img/logo.png" alt="" width={56} height={56} priority className="size-[56px] rounded-full object-cover" />
          <span className="flex flex-col items-start leading-[1.1]">
            <Image src="/img/nome.png" alt="AG criando" width={116} height={34} priority className="h-[34px] w-auto" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-700">Personalizados</span>
          </span>
        </Link>

        <div className="hidden items-center gap-4 desktop:flex">
          {NAV_LINKS.map((link) => {
            const active = isActiveLink(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap border-b-[1.5px] py-[6px] text-[15px] no-underline',
                  active ? 'border-accent text-accent-700 hover:text-accent-700' : 'border-transparent text-text hover:text-accent-700',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <button type="button" className="btn btn-secondary" onClick={() => { close(); useCart.getState().setOpen(true); }}>
          <ShoppingBagOpen weight="duotone" size={18} />
          <span>Minha lista</span>
          {count > 0 && (
            <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-[10px] bg-accent-2 px-[6px] text-xs text-white">
              {count}
            </span>
          )}
        </button>
        <button
          type="button"
          className="btn btn-icon btn-secondary desktop:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X weight="duotone" size={20} /> : <List weight="duotone" size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="flex flex-col gap-[2px] px-4 pb-4 pt-2 desktop:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={cn('py-3 text-[22px] font-semibold no-underline', isActiveLink(link.href, pathname) ? 'text-accent-700' : 'text-text')}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
