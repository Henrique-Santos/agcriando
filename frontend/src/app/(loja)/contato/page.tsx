import { Clock, InstagramLogo, WhatsappLogo } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import { ContactForm } from '@/components/loja/ContactForm';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP } from '@/lib/config';
import { phoneLabel } from '@/lib/format';
import { GENERIC_MESSAGE, waLink } from '@/lib/whatsapp';

export const metadata: Metadata = { title: 'Contato', description: 'Vamos conversar sobre o seu presente?' };

const caption = 'text-[13px] text-neutral-700';
const row = 'flex items-center gap-3 text-text no-underline hover:text-text';

export default function ContactPage() {
  return (
    <section className="flex flex-wrap gap-x-[80px] gap-y-8 pb-24 pt-8">
      <div className="max-w-[520px] flex-[1_1_360px]">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-accent-700">Contato</p>
        <h1 className="mb-6 text-[clamp(40px,6vw,68px)] leading-[1.05] tracking-[-0.03em]">Vamos conversar sobre o seu presente?</h1>
        <div className="flex flex-col gap-4">
          <a href={waLink(GENERIC_MESSAGE)} target="_blank" rel="noopener noreferrer" className={row}>
            <WhatsappLogo weight="duotone" size={32} className="text-accent" />
            <span className="flex flex-col"><span className={caption}>WhatsApp</span><span className="text-2xl font-semibold">{phoneLabel(WHATSAPP)}</span></span>
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={row}>
            <InstagramLogo weight="duotone" size={32} className="text-accent" />
            <span className="flex flex-col"><span className={caption}>Instagram</span><span className="text-2xl font-semibold">{INSTAGRAM_HANDLE}</span></span>
          </a>
          <div className="flex items-center gap-3">
            <Clock weight="duotone" size={32} className="text-accent" />
            <span className="flex flex-col"><span className={caption}>Atendimento</span><span className="text-lg">Segunda a sábado, das 9h às 18h</span></span>
          </div>
        </div>
      </div>
      <ContactForm />
    </section>
  );
}
