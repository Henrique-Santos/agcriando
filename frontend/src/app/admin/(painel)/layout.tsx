import type { Metadata } from 'next';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminProviders } from '@/components/admin/AdminProviders';

export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <AdminHeader />
      <div className="mx-auto box-border flex max-w-[1320px] flex-wrap items-start gap-x-[56px] gap-y-6 px-4 pb-24">
        <AdminNav />
        <main className="min-w-0 flex-1 pt-6">{children}</main>
      </div>
    </AdminProviders>
  );
}
