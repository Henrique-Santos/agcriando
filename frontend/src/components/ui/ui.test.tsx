import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { chipClass } from './chip';
import { Field } from './Field';
import { QtyStepper } from './QtyStepper';
import { Tag } from './Tag';

describe('ui primitives', () => {
  it('Field links label to the control and shows the error', () => {
    render(<Field label="Seu nome" htmlFor="nome" error="Obrigatório."><input id="nome" /></Field>);
    expect(screen.getByLabelText('Seu nome')).toBeInTheDocument();
    expect(screen.getByText('Obrigatório.')).toHaveClass('text-accent-2-700');
  });

  it('Tag applies the tone class', () => {
    render(<Tag tone="accent-2">Novo</Tag>);
    expect(screen.getByText('Novo')).toHaveClass('tag', 'tag-accent-2');
  });

  it('QtyStepper calls the handlers', async () => {
    const inc = vi.fn();
    const dec = vi.fn();
    render(<QtyStepper value={3} onIncrement={inc} onDecrement={dec} />);
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Diminuir' }));
    expect(inc).toHaveBeenCalledOnce();
    expect(dec).toHaveBeenCalledOnce();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('chipClass highlights the selected chip', () => {
    expect(chipClass(true)).toContain('bg-accent');
    expect(chipClass(false)).toContain('border-divider');
  });
});
