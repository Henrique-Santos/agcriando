import type { ReactNode } from 'react';

export function Field({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <span className="mt-1 block text-[13px] text-accent-2-700">{error}</span>}
    </div>
  );
}
