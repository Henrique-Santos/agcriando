import { InstagramLogo } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/config';

export const metadata: Metadata = { title: 'Sobre', description: 'Feito à mão, pensado para alguém.' };

const paragraph = 'mb-4 text-pretty text-[19px] leading-[1.65]';

export default function AboutPage() {
  return (
    <section className="flex flex-wrap items-start gap-x-[72px] gap-y-8 pb-24 pt-8">
      <div className="max-w-[620px] flex-[1_1_420px]">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-accent-700">Sobre a loja</p>
        <h1 className="mb-6 text-[clamp(40px,6vw,68px)] leading-[1.05] tracking-[-0.03em]">
          Feito à mão, <span className="font-normal italic">pensado para alguém.</span>
        </h1>
        <p className={paragraph}>A AG Criando nasceu do gosto por transformar papel, tinta e pequenas ideias em presentes que emocionam. Cada caderno, caneca ou botton é criado sob encomenda, com o nome, a frase ou o tema que você escolher.</p>
        <p className={paragraph}>Gostamos de detalhes: a flor certa na capa, a cor que a pessoa ama, o acabamento que faz durar. É um trabalho pequeno, feito com calma — e é justamente isso que torna cada peça única.</p>
        <p className={`${paragraph} mb-6`}>Atendemos pedidos individuais e lembrancinhas em quantidade para congressos, escolas, aniversários e datas especiais.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/catalogo" className="btn btn-primary px-[22px] py-[14px] text-base">Conhecer os produtos</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary px-[22px] py-[14px] text-base">
            <InstagramLogo weight="duotone" /> {INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>
      <div className="flex max-w-[460px] flex-[1_1_320px] flex-col gap-4">
        <Image src="/img/logo.png" alt="Logo AG Criando Personalizados" width={460} height={460} className="aspect-square w-full object-cover" />
        <Image src="/img/caderno-lavanda.jpeg" alt="Caderno personalizado" width={460} height={345} className="aspect-[4/3] w-full rounded-md object-cover" />
      </div>
    </section>
  );
}
