import Link from 'next/link';

export function NotFoundContent() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[620px] flex-col items-start justify-center gap-4 px-4 py-8">
      <p className="text-xs uppercase tracking-[0.16em] text-accent-700">Página não encontrada</p>
      <h1 className="text-[clamp(32px,5vw,48px)] leading-[1.1] tracking-[-0.02em]">Não encontramos o que você procurava.</h1>
      <p className="text-[17px] text-neutral-800">O produto pode ter saído do catálogo ou o endereço mudou.</p>
      <Link href="/catalogo" className="btn btn-primary text-base">Ver catálogo</Link>
    </section>
  );
}
