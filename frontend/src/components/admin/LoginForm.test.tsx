import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { LoginForm } from './LoginForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const fill = async (email: string, password: string) => {
  if (email) await userEvent.type(screen.getByLabelText('E-mail'), email);
  if (password) await userEvent.type(screen.getByLabelText('Senha'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
};

describe('LoginForm', () => {
  beforeEach(() => push.mockClear());

  it('asks for both fields before calling the API', async () => {
    const { calls } = mockFetch(() => undefined);
    render(<LoginForm />);

    await fill('', '');

    expect(screen.getByText('Preencha e-mail e senha.')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('shows the API message on wrong credentials', async () => {
    mockFetch(() => ({ status: 401, json: { title: 'E-mail ou senha incorretos.' } }));
    render(<LoginForm />);

    await fill('admin@agcriando.local', 'errada-123');

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('explains the rate limit', async () => {
    mockFetch(() => ({ status: 429, json: { title: 'Too Many Requests' } }));
    render(<LoginForm />);

    await fill('admin@agcriando.local', 'qualquer-123');

    expect(await screen.findByText('Muitas tentativas. Aguarde um minuto e tente novamente.')).toBeInTheDocument();
  });

  it('goes to the products panel after logging in', async () => {
    const { calls } = mockFetch(() => ({ json: { email: 'admin@agcriando.local', roles: ['Admin'] } }));
    render(<LoginForm />);

    await fill('admin@agcriando.local', 'agcriando-dev-123');

    expect(calls[0]).toMatchObject({ url: '/api/auth/login', method: 'POST', body: { email: 'admin@agcriando.local', password: 'agcriando-dev-123' } });
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/admin/produtos'));
  });

  it('toggles password visibility', async () => {
    render(<LoginForm />);
    const input = screen.getByLabelText('Senha');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
