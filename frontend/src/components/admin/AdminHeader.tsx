'use client';

import { SignOut, Storefront } from '@phosphor-icons/react/ssr';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Tag } from '@/components/ui/Tag';
import { useLogout, useMe } from '@/lib/admin/queries';

export function AdminHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useMe();
  const logout = useLogout();

  const signOut = async () => {
    await logout.mutateAsync().catch(() => {});
    queryClient.clear();
    router.replace('/admin/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] backdrop-blur-[8px]">
      <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2">
        <div className="mr-auto flex items-center gap-2">
          <Image src="/img/logo.png" alt="" width={48} height={48} className="size-[48px] object-contain" />
          <Image src="/img/nome.png" alt="AG criando" width={96} height={28} className="h-[28px] w-auto" />
          <Tag tone="accent" className="ml-1">Painel</Tag>
        </div>
        <a className="btn btn-ghost" href="/" target="_blank" rel="noopener noreferrer">
          <Storefront weight="duotone" size={18} /><span className="hidden wide:inline">Ver loja</span>
        </a>
        {me.data && <span className="hidden text-sm text-neutral-700 wide:inline">{me.data.email}</span>}
        <button type="button" className="btn btn-secondary" onClick={signOut}><SignOut weight="duotone" size={18} />Sair</button>
      </div>
    </header>
  );
}
