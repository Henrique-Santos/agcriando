import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StoreError from './error';

describe('store error boundary', () => {
  it('shows a friendly message and retries', async () => {
    const reset = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<StoreError error={new Error('API fora do ar')} reset={reset} />);

    expect(screen.getByRole('heading', { name: 'Não conseguimos carregar a loja agora.' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
