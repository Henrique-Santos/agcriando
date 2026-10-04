import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('opens WhatsApp with name, subject and message', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText('Seu nome'), 'Ana');
    await userEvent.selectOptions(screen.getByLabelText('Sobre o quê?'), 'Pedido em quantidade');
    await userEvent.type(screen.getByLabelText('Mensagem'), '50 bottons para o congresso');
    await userEvent.click(screen.getByRole('button', { name: /Enviar pelo WhatsApp/ }));

    const text = new URL(open.mock.calls[0][0]).searchParams.get('text');
    expect(text).toBe('Olá, AG Criando! Aqui é Ana.\nAssunto: Pedido em quantidade\n\n50 bottons para o congresso');
  });
});
