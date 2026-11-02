import { CartDrawer } from '@/components/loja/CartDrawer';
import { CartFloatButton } from '@/components/loja/CartFloatButton';
import { CatalogProvider } from '@/components/loja/CatalogProvider';
import { Footer } from '@/components/loja/Footer';
import { Header } from '@/components/loja/Header';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCatalog } from '@/lib/api/server';
import { SITE_URL } from '@/lib/config';
import { storeJsonLd } from '@/lib/seo';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <CatalogProvider catalog={catalog}>
      <JsonLd data={storeJsonLd(SITE_URL)} />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4">{children}</main>
        <Footer />
        <CartDrawer />
        <CartFloatButton />
      </div>
    </CatalogProvider>
  );
}
