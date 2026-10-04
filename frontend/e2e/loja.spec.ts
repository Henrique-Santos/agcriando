import { expect, test } from '@playwright/test';

test('cliente personaliza um produto e gera o pedido do WhatsApp', async ({ page }) => {
  await page.addInitScript(() => {
    window.open = ((url?: string | URL) => { (window as unknown as { __opened: string }).__opened = String(url); return null; }) as typeof window.open;
  });

  await page.goto('/produto/caderno-floral');
  await expect(page.getByRole('heading', { level: 1, name: 'Caderno floral com nome' })).toBeVisible();

  await page.getByRole('radio', { name: 'Pontilhado' }).click();
  await page.getByLabel('Nome na capa').fill('Emelli');
  await page.getByRole('button', { name: 'Aumentar' }).click();
  await page.getByRole('button', { name: /Adicionar à minha lista/ }).click();

  const drawer = page.getByRole('dialog', { name: 'Minha lista' });
  await expect(drawer.getByText('Caderno floral com nome')).toBeVisible();
  await drawer.getByLabel('Seu nome').fill('Ana');
  await drawer.getByRole('button', { name: /Enviar pedido pelo WhatsApp/ }).click();

  const opened = await page.evaluate(() => (window as unknown as { __opened: string }).__opened);
  const text = new URL(opened).searchParams.get('text')!;
  expect(text).toContain('1. Caderno floral com nome — 2 un. (R$ 139,80)');
  expect(text).toContain('Miolo: Pontilhado');
  expect(text).toContain('Nome na capa: Emelli');
  expect(text).toContain('Meu nome: Ana');

  await page.reload();
  await page.getByRole('button', { name: /Minha lista/ }).click();
  await expect(page.getByRole('dialog', { name: 'Minha lista' }).getByText('Caderno floral com nome')).toBeVisible();
});
