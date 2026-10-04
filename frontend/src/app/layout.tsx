import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config';
import { serif } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'AG Criando Personalizados', template: '%s — AG Criando' },
  description: 'Papelaria e presentes personalizados: cadernos, canecas, bottons, adesivos e lembrancinhas feitos um a um, com carinho.',
  openGraph: { siteName: 'AG Criando Personalizados', locale: 'pt_BR', type: 'website', images: ['/img/logo.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={serif.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
