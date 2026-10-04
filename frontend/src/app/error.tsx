'use client';

// Na raiz, o error boundary envolve o layout da loja (que busca o catálogo) mantendo o layout raiz,
// com CSS e fontes. O (loja)/error.tsx não cobre o layout do próprio segmento.
export { default } from './(loja)/error';
