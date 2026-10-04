'use client';

import { ArrowDown, ArrowUp, Plus, Trash } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory, useRenameCategory, useReorderCategories } from '@/lib/admin/queries';
import { errorMessage } from '@/lib/api/browser';
import type { AdminCategory } from '@/lib/api/types';
import { plural } from '@/lib/format';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

export function CategoriesPanel() {
  const router = useRouter();
  const toast = useToast();
  const categories = useCategories();
  const create = useCreateCategory();
  const rename = useRenameCategory();
  const reorder = useReorderCategories();
  const remove = useDeleteCategory();
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const list = categories.data ?? [];

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const value = label.trim();
    if (!value) return setError('Digite o nome da categoria.');
    try {
      await create.mutateAsync(value);
      setLabel('');
      toast('Categoria adicionada');
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível adicionar a categoria.'));
    }
  };

  const move = (index: number, delta: -1 | 1) => {
    const ids = list.map((c) => c.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    reorder.mutate(ids, { onSuccess: () => toast('Ordem atualizada'), onError: (e) => toast(errorMessage(e), true) });
  };

  const save = (category: AdminCategory, value: string, revert: () => void) =>
    rename.mutate({ id: category.id, label: value }, {
      onSuccess: () => toast('Categoria renomeada'),
      onError: (e) => { revert(); toast(errorMessage(e), true); },
    });

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => { toast('Categoria excluída'); setDeleting(null); },
      onError: (e) => { toast(errorMessage(e), true); setDeleting(null); },
    });
  };

  return (
    <section className="max-w-[760px]">
      <h1 className="mb-[6px] text-[clamp(34px,4vw,48px)] tracking-[-0.02em]">Categorias</h1>
      <p className="mb-6 text-base text-neutral-800">A ordem desta lista é a mesma que aparece no site.</p>

      <form onSubmit={add} noValidate className="mb-2 flex flex-wrap gap-2">
        <input
          className="input min-h-[44px] w-auto flex-[1_1_260px] text-base"
          placeholder="Nome da nova categoria"
          aria-label="Nome da nova categoria"
          value={label}
          onChange={(e) => { setLabel(e.target.value); setError(''); }}
        />
        <button type="submit" className="btn btn-primary min-h-[44px] text-[15px]" disabled={create.isPending}>
          <Plus weight="duotone" size={18} />Adicionar categoria
        </button>
      </form>
      {error && <p role="alert" className="mb-2 text-sm text-accent-2-700">{error}</p>}

      <div className="mt-4">
        {list.map((category, i) => (
          <CategoryRow
            key={`${category.id}:${category.label}`}
            category={category}
            first={i === 0}
            last={i === list.length - 1}
            onSave={(value, revert) => save(category, value, revert)}
            onView={() => router.push(`/admin/produtos?cat=${encodeURIComponent(category.id)}`)}
            onUp={() => move(i, -1)}
            onDown={() => move(i, 1)}
            onDelete={() => setDeleting(category)}
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-neutral-700">Só é possível excluir categorias sem produtos. Categorias vazias não aparecem na loja.</p>

      {deleting && (
        <ConfirmDialog
          title="Excluir categoria?"
          body={`A categoria “${deleting.label}” será removida.`}
          cta="Excluir categoria"
          busy={remove.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}

type RowProps = {
  category: AdminCategory;
  first: boolean;
  last: boolean;
  onSave: (value: string, revert: () => void) => void;
  onView: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
};

function CategoryRow({ category, first, last, onSave, onView, onUp, onDown, onDelete }: RowProps) {
  const [draft, setDraft] = useState(category.label);
  const hasItems = category.productCount > 0;

  const commit = () => {
    const value = draft.trim();
    if (value && value !== category.label) onSave(value, () => setDraft(category.label));
    else setDraft(category.label);
  };

  return (
    <div data-row className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] py-[10px]">
      <input
        aria-label="Nome da categoria"
        className="input min-h-[42px] border-transparent bg-transparent text-base hover:border-divider focus-visible:border-accent"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
      <button type="button" onClick={onView} className="whitespace-nowrap text-sm text-accent-700">
        {plural(category.productCount, 'produto', 'produtos')}
      </button>
      <div className="flex gap-[2px]">
        <button type="button" className="btn btn-icon btn-ghost" aria-label="Subir" disabled={first} onClick={onUp}><ArrowUp weight="duotone" size={16} /></button>
        <button type="button" className="btn btn-icon btn-ghost" aria-label="Descer" disabled={last} onClick={onDown}><ArrowDown weight="duotone" size={16} /></button>
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          aria-label="Excluir"
          disabled={hasItems}
          title={hasItems ? 'Mova ou exclua os produtos desta categoria antes' : 'Excluir categoria'}
          onClick={onDelete}
        >
          <Trash weight="duotone" size={16} />
        </button>
      </div>
    </div>
  );
}
