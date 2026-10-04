export const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/como-funciona', label: 'Como funciona' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/duvidas', label: 'Dúvidas' },
  { href: '/contato', label: 'Contato' },
] as const;

export function isActiveLink(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/catalogo') return pathname.startsWith('/catalogo') || pathname.startsWith('/produto');
  return pathname.startsWith(href);
}
