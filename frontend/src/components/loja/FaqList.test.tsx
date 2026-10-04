import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FaqList } from './FaqList';

const items: [string, string][] = [['Pergunta A?', 'Resposta A.'], ['Pergunta B?', 'Resposta B.']];

describe('FaqList', () => {
  it('opens the first answer and keeps a single answer open', async () => {
    render(<FaqList items={items} />);
    expect(screen.getByText('Resposta A.')).toBeInTheDocument();
    expect(screen.queryByText('Resposta B.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pergunta B?' }));
    expect(screen.getByText('Resposta B.')).toBeInTheDocument();
    expect(screen.queryByText('Resposta A.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pergunta B?' }));
    expect(screen.queryByText('Resposta B.')).not.toBeInTheDocument();
  });

  it('exposes the expanded state', () => {
    render(<FaqList items={items} />);
    expect(screen.getByRole('button', { name: 'Pergunta A?' })).toHaveAttribute('aria-expanded', 'true');
  });
});
