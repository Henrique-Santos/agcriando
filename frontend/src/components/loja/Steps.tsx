import type { STEPS } from '@/lib/content';

export function Steps({ steps }: { steps: typeof STEPS }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-6 gap-y-8">
      {steps.map((s) => (
        <div key={s.n} className="flex flex-col gap-3">
          <div className="font-heading text-[64px] font-semibold leading-none text-accent">{s.n}</div>
          <h3 className="text-[22px]">{s.title}</h3>
          <p className="max-w-[280px] text-pretty text-[15px] text-neutral-800">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
