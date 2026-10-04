import { cn } from '@/lib/cn';

type Props = { value: number; onIncrement: () => void; onDecrement: () => void; size?: 'md' | 'sm' };

export function QtyStepper({ value, onIncrement, onDecrement, size = 'md' }: Props) {
  const button = cn('text-text', size === 'md' ? 'size-[44px] text-lg' : 'size-[32px]');
  return (
    <div className="flex items-center rounded-md border border-divider">
      <button type="button" aria-label="Diminuir" className={button} onClick={onDecrement}>−</button>
      <span className={cn('text-center', size === 'md' ? 'min-w-[36px] text-base' : 'min-w-[26px] text-sm')} aria-live="polite">{value}</span>
      <button type="button" aria-label="Aumentar" className={button} onClick={onIncrement}>+</button>
    </div>
  );
}
