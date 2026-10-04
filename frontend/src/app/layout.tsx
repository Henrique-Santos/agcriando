import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import { SITE_URL } from '@/lib/config';
import './globals.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap',
});

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
