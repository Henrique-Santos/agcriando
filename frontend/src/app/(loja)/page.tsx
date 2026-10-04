import { ArrowRight, InstagramLogo } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { CategoryGrid } from '@/components/loja/CategoryGrid';
import { ProductCard } from '@/components/loja/ProductCard';
import { ProductGrid } from '@/components/loja/ProductGrid';
import { Steps } from '@/components/loja/Steps';
import { getCatalog } from '@/lib/api/server';
import { categoryLabel, categoryLinks, featuredProducts } from '@/lib/catalog';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/config';
import { STEPS } from '@/lib/content';

const sectionTitle = 'text-[clamp(28px,3.4vw,40px)]';
const showcase = ['caderno-girassois.jpeg', 'quadro-familia.jpeg', 'ecobag.jpeg', 'botton-jw.jpeg'];

export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <>
      <section className="flex min-h-[calc(100svh-80px)] flex-wrap content-center items-center justify-between gap-x-8 gap-y-4 pb-6 pt-4">
        <div className="order-2 min-w-0 max-w-[780px] flex-[1_1_520px] narrow:order-none">
          <p className="mb-4 text-[clamp(12px,1.8vh,15px)] uppercase tracking-[0.16em] text-accent-700">Papelaria e presentes personalizados</p>
          <h1 className="mb-6 text-balance text-[clamp(40px,min(7.4vw,10.5vh),112px)] leading-[1.02] tracking-[-0.025em]">
            Presentes com o nome de quem <span className="text-accent">você ama.</span>
          </h1>
          <p className="mb-6 max-w-[620px] text-pretty text-[clamp(17px,min(1.8vw,3vh),25px)] leading-normal">
            Cadernos, canecas, bottons, adesivos e lembrancinhas feitos um a um, com carinho, para marcar momentos que merecem ser lembrados.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/catalogo" className="btn btn-primary px-[28px] py-[16px] text-[clamp(16px,2.4vh,19px)]">Ver catálogo</Link>
            <Link href="/como-funciona" className="btn btn-secondary px-[28px] py-[16px] text-[clamp(16px,2.4vh,19px)]">Como encomendar</Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] justify-center">
          <Image
            src="/img/logo.png"
            alt="AG criando Personalizados"
            width={640}
            height={640}
            priority
            className="aspect-square w-full max-w-[min(100%,30svh)] object-contain narrow:max-w-[min(640px,calc(100svh-130px))]"
          />
        </div>
      </section>

      <section className="pb-[88px]">
        <h2 className={`${sectionTitle} mb-6`}>Escolha por categoria</h2>
        <CategoryGrid links={categoryLinks(catalog)} />
      </section>

      <section className="pb-[88px]">
        <div className="mb-6 flex flex-wrap items-baseline gap-4">
          <h2 className={`${sectionTitle} mr-auto`}>Os mais pedidos</h2>
          <Link href="/catalogo" className="btn btn-ghost text-base">Ver todo o catálogo <ArrowRight weight="duotone" /></Link>
        </div>
        <ProductGrid>
          {featuredProducts(catalog).map((p) => (
            <ProductCard key={p.id} product={p} categoryLabel={categoryLabel(catalog, p.categoryId)} />
          ))}
        </ProductGrid>
      </section>

      <section className="pb-[88px]">
        <h2 className={`${sectionTitle} mb-2`}>Como encomendar</h2>
        <p className="mb-8 max-w-[520px] text-[17px] text-neutral-800">Sem cadastro e sem complicação. Você monta sua lista aqui e a gente conversa pelo WhatsApp.</p>
        <Steps steps={STEPS} />
      </section>

      <section className="flex flex-wrap items-end gap-8 pb-24">
        <div className="max-w-[460px] flex-[1_1_320px]">
          <p className="mb-4 text-[clamp(28px,3.6vw,44px)] italic leading-[1.15] tracking-[-0.015em]">“Cada peça é pensada para uma pessoa só.”</p>
          <p className="mb-4 text-base text-neutral-800">Veja os trabalhos mais recentes e os bastidores no Instagram.</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-base">
            <InstagramLogo weight="duotone" size={18} /> {INSTAGRAM_HANDLE}
          </a>
        </div>
        <div className="grid flex-[2_1_420px] grid-cols-4 gap-2">
          {showcase.map((file) => (
            <Image key={file} src={`/img/${file}`} alt="" width={300} height={300} className="aspect-square w-full rounded-md object-cover" />
          ))}
        </div>
      </section>
    </>
  );
}
