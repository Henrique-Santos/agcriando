import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RootError from '../error';
import StoreError from './error';

describe.each([['(loja)/error', StoreError], ['root error (wraps the store layout)', RootError]])('%s', (_name, ErrorPage) => {
  it('shows a friendly message and retries by re-fetching', async () => {
    const retry = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorPage error={new Error('API fora do ar')} retry={retry} />);

    expect(screen.getByRole('heading', { name: 'Não conseguimos carregar a loja agora.' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
