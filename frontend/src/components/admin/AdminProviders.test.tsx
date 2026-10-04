import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useProducts } from '@/lib/admin/queries';
import { mockFetch } from '@/test/fetch-mock';
import { AdminProviders } from './AdminProviders';

function Probe() {
  const { isError } = useProducts({ q: '', cat: 'all', status: 'all' });
  return <p>{isError ? 'erro' : 'carregando'}</p>;
}

describe('AdminProviders', () => {
  it('sends the user back to login when the session expires', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    mockFetch(() => ({ status: 401, json: { title: 'Unauthorized' } }));

    render(<AdminProviders><Probe /></AdminProviders>);

    expect(await screen.findByText('erro')).toBeInTheDocument();
    expect(assign).toHaveBeenCalledWith('/admin/login');
  });
});
