import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { CATALOG_TAG } from '@/lib/api/tags';

function validSecret(received: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!validSecret(request.headers.get('x-revalidate-secret'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tag?: unknown } | null;
  if (body?.tag !== CATALOG_TAG) return NextResponse.json({ ok: false }, { status: 400 });

  // Expira na hora: a próxima visita já busca o catálogo atualizado na API.
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
