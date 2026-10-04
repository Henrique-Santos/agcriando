import type { ReactNode } from 'react';

export function ProductGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-6 narrow:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">{children}</div>;
}
