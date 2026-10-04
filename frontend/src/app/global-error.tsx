'use client';

import StoreError from './(loja)/error';

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <StoreError {...props} />
      </body>
    </html>
  );
}
