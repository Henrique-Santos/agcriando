'use client';

import StoreError from './(loja)/error';
import { serif } from './fonts';
import './globals.css';

// Último recurso: substitui o layout raiz, por isso carrega os próprios estilos e fontes.
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR" className={serif.variable}>
      <body className="min-h-screen antialiased">
        <StoreError {...props} />
      </body>
    </html>
  );
}
