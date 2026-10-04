export function NoPhoto({ small = false }: { small?: boolean }) {
  return (
    <div className={`bg-stripes absolute inset-0 grid place-items-center font-mono text-neutral-700 ${small ? 'text-[12px]' : 'text-[13px]'}`}>
      foto do produto
    </div>
  );
}
