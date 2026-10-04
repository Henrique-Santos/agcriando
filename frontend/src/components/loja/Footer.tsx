import Image from 'next/image';
import Link from 'next/link';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP } from '@/lib/config';
import { phoneLabel } from '@/lib/format';
import { NAV_LINKS } from '@/lib/navigation';
import { GENERIC_MESSAGE, waLink } from '@/lib/whatsapp';

const heading = 'mb-1 text-[11px] uppercase tracking-[0.14em] text-neutral-700';
const link = 'text-[15px] text-text no-underline hover:text-accent';

export function Footer() {
  return (
    <footer className="mt-auto bg-surface">
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-[72px] gap-y-8 px-4 pb-6 pt-[56px]">
        <div className="max-w-[340px] flex-[1_1_260px]">
          <div className="mb-3 flex items-center gap-2">
            <Image src="/img/logo.png" alt="" width={64} height={64} className="size-[64px] rounded-full object-cover" />
            <Image src="/img/nome.png" alt="AG criando" width={137} height={40} className="h-[40px] w-auto" />
          </div>
          <p className="text-[15px] text-neutral-800">Papelaria e presentes personalizados, feitos um a um com carinho.</p>
        </div>
        <div className="flex flex-[0_1_180px] flex-col gap-2">
          <span className={heading}>Loja</span>
          {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} className={link}>{l.label}</Link>)}
        </div>
        <div className="flex flex-[0_1_220px] flex-col gap-2">
          <span className={heading}>Fale com a gente</span>
          <a href={waLink(GENERIC_MESSAGE)} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp {phoneLabel(WHATSAPP)}</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={link}>Instagram {INSTAGRAM_HANDLE}</a>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-4 px-4 pb-6 text-[13px] text-neutral-700">
        <span className="mr-auto">© {new Date().getFullYear()} AG Criando Personalizados</span>
        <Link href="/admin/login" className="text-neutral-700">Área administrativa</Link>
      </div>
    </footer>
  );
}
