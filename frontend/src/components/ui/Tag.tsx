import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Tag({ tone, className, children }: { tone: 'accent' | 'accent-2' | 'neutral'; className?: string; children: ReactNode }) {
  return <span className={cn('tag', `tag-${tone}`, className)}>{children}</span>;
}
