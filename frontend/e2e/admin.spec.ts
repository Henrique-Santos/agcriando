import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const name = `Caneca E2E ${Date.now()}`;

async function login(page: Page) {
  await page.goto('/admin/produtos');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel('E-mail').fill('admin@agcriando.local');
  await page.getByLabel('Senha', { exact: true }).fill('agcriando-dev-123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Produtos' })).toBeVisible();
}

test.describe.serial('admin', () => {
  test('cadastra produto com foto e ele aparece na loja', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: 'Novo produto' }).click();
    await page.getByLabel('Nome do produto *').fill(name);
    await page.getByLabel('Categoria *').selectOption({ label: 'Canecas & potes' });
    await page.getByLabel('Preço por unidade *').fill('45,90');
    await page.getByLabel('Enviar foto').setInputFiles(path.join(__dirname, 'fixtures', 'foto.jpeg'));
    await expect(page.getByRole('img', { name: 'Foto do produto' })).toBeVisible();
    await page.getByRole('button', { name: 'Salvar produto' }).click();
    await expect(page.getByRole('status')).toHaveText('Produto cadastrado');

    await page.goto(`/catalogo?q=${encodeURIComponent(name)}`);
    await page.getByRole('link', { name: new RegExp(name) }).click();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByText('R$ 45,90').first()).toBeVisible();
  });

  test('oculta o produto e ele some da loja', async ({ page }) => {
    await login(page);

    await page.getByLabel('Buscar produto').fill(name);
    const row = page.locator('[data-row]', { hasText: name });
    await row.getByRole('button', { name: /Na loja/ }).click();
    await expect(page.getByRole('status')).toHaveText('Produto ocultado da loja');

    await page.goto(`/catalogo?q=${encodeURIComponent(name)}`);
    await expect(page.getByText(/Nenhum produto encontrado/)).toBeVisible();
  });
});
