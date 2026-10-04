'use client';

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-8">
      <p className="text-[17px] text-neutral-800">{message}</p>
      <button type="button" className="btn btn-secondary" onClick={onRetry}>Tentar de novo</button>
    </div>
  );
}
