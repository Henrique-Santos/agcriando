'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash, UploadSimple, X } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { useState, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Field } from '@/components/ui/Field';
import { PRODUCT_FIELDS, productFormSchema, TAG_OPTIONS, toFormValues, toProductInput, type ProductFormValues } from '@/lib/admin/product-form';
import { useDeleteProduct, useSaveProduct, useUploadImage } from '@/lib/admin/queries';
import { ApiError, errorMessage } from '@/lib/api/browser';
import type { AdminCategory, Product } from '@/lib/api/types';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

type Props = { product: Product | null; categories: AdminCategory[]; defaultCategoryId?: string; onClose: () => void };

const input = 'input min-h-[44px] text-base';
const section = 'flex flex-col gap-3';
const grid = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 15 });

export function ProductEditor({ product, categories, defaultCategoryId, onClose }: Props) {
  const toast = useToast();
  const save = useSaveProduct();
  const remove = useDeleteProduct();
  const upload = useUploadImage();
  const [confirming, setConfirming] = useState(false);
  const { register, handleSubmit, setError, setValue, control, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product, defaultCategoryId),
  });
  const imageUrl = useWatch({ control, name: 'imageUrl' });
  const tag = useWatch({ control, name: 'tag' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: product?.id, input: toProductInput(values) });
      toast(product ? 'Produto atualizado' : 'Produto cadastrado');
      onClose();
    } catch (error) {
      const fields = error instanceof ApiError
        ? Object.entries(error.fieldErrors).filter(([field]) => (PRODUCT_FIELDS as string[]).includes(field))
        : [];
      fields.forEach(([field, message]) => setError(field as keyof ProductFormValues, { message }));
      if (fields.length === 0) toast(errorMessage(error, 'Não foi possível salvar. Tente novamente.'), true);
    }
  });

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { url } = await upload.mutateAsync(file);
      setValue('imageUrl', url, { shouldDirty: true });
    } catch (error) {
      toast(errorMessage(error, 'Não foi possível enviar a foto.'), true);
    }
  };

  const confirmDelete = () => {
    if (!product) return;
    remove.mutate(product.id, {
      onSuccess: () => { toast('Produto excluído'); onClose(); },
      onError: (error) => { toast(errorMessage(error), true); setConfirming(false); },
    });
  };

  const tagOptions = tag && !TAG_OPTIONS.includes(tag) ? [...TAG_OPTIONS, tag] : TAG_OPTIONS;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div aria-hidden className="absolute inset-0 animate-fade bg-[color-mix(in_srgb,var(--color-neutral-900)_45%,transparent)]" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={product ? 'Editar produto' : 'Novo produto'} className="relative flex h-full w-[min(640px,100%)] animate-slide-in flex-col bg-bg shadow-lg">
        <div className="flex items-center px-4 pb-3 pt-4">
          <h2 className="mr-auto text-[28px]">{product ? 'Editar produto' : 'Novo produto'}</h2>
          <button type="button" className="btn btn-icon btn-ghost" aria-label="Fechar" onClick={onClose}><X weight="duotone" size={20} /></button>
        </div>

        <form id="product-form" onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-6 overflow-auto px-4 pb-6">
          <div className="flex items-start gap-4">
            <div className="bg-stripes relative grid h-[160px] w-[128px] flex-none place-items-center overflow-hidden rounded-md">
              {imageUrl
                ? <Image src={imageUrl} alt="Foto do produto" fill sizes="128px" className="object-cover" />
                : <span className="font-mono text-[12px] text-neutral-700">sem foto</span>}
            </div>
            <div className="flex flex-col items-start gap-2 pt-1">
              <label className="btn btn-secondary cursor-pointer">
                <UploadSimple weight="duotone" size={18} />
                {upload.isPending ? 'Enviando…' : imageUrl ? 'Trocar foto' : 'Enviar foto'}
                <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Enviar foto" className="hidden" onChange={onFile} disabled={upload.isPending} />
              </label>
              {imageUrl && <button type="button" className="btn btn-ghost" onClick={() => setValue('imageUrl', null, { shouldDirty: true })}>Remover foto</button>}
              <span className="max-w-[260px] text-[13px] text-neutral-700">JPG, PNG ou WebP até 10 MB. A foto é reduzida automaticamente para carregar rápido.</span>
            </div>
          </div>

          <div className={section}>
            <h3 className="text-[19px]">Informações</h3>
            <Field label="Nome do produto *" htmlFor="pf-name" error={errors.name?.message}>
              <input id="pf-name" className={input} placeholder="Ex.: Caneca floral com nome" {...register('name')} />
            </Field>
            <div style={grid(200)}>
              <Field label="Categoria *" htmlFor="pf-category" error={errors.categoryId?.message}>
                <select id="pf-category" className={input} {...register('categoryId')}>
                  <option value="">Escolha…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Etiqueta" htmlFor="pf-tag" error={errors.tag?.message}>
                <select id="pf-tag" className={input} {...register('tag')}>
                  <option value="">Nenhuma</option>
                  {tagOptions.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Descrição" htmlFor="pf-description" error={errors.description?.message}>
              <textarea id="pf-description" className="input min-h-[110px] text-base" placeholder="Material, tamanho, acabamento…" {...register('description')} />
            </Field>
          </div>

          <div className={section}>
            <h3 className="text-[19px]">Preço e produção</h3>
            <div style={grid(160)}>
              <Field label="Preço por unidade *" htmlFor="pf-price" error={errors.price?.message}>
                <div className="relative">
                  <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[15px] text-neutral-700">R$</span>
                  <input id="pf-price" inputMode="decimal" className={`${input} pl-[36px]`} placeholder="0,00" {...register('price')} />
                </div>
              </Field>
              <Field label="Pedido mínimo" htmlFor="pf-min" error={errors.minQuantity?.message}>
                <input id="pf-min" inputMode="numeric" className={input} placeholder="Sem mínimo" {...register('minQuantity')} />
              </Field>
              <Field label="Prazo (dias úteis)" htmlFor="pf-days" error={errors.productionDays?.message}>
                <input id="pf-days" className={input} placeholder="Ex.: 5 a 7" {...register('productionDays')} />
              </Field>
            </div>
          </div>

          <div className={section}>
            <div>
              <h3 className="mb-1 text-[19px]">Personalização</h3>
              <p className="text-sm text-neutral-700">O que o cliente preenche na página do produto.</p>
            </div>
            <div style={grid(200)}>
              <Field label="Pergunta" htmlFor="pf-field" error={errors.customFieldLabel?.message}>
                <input id="pf-field" className={input} placeholder="Ex.: Nome na capa" {...register('customFieldLabel')} />
              </Field>
              <Field label="Exemplo de resposta" htmlFor="pf-ph" error={errors.customFieldPlaceholder?.message}>
                <input id="pf-ph" className={input} placeholder="Ex.: Emelli" {...register('customFieldPlaceholder')} />
              </Field>
              <Field label="Nome da opção" htmlFor="pf-opt" error={errors.optionName?.message}>
                <input id="pf-opt" className={input} placeholder="Ex.: Miolo" {...register('optionName')} />
              </Field>
              <Field label="Escolhas, separadas por vírgula" htmlFor="pf-optvals" error={errors.optionValues?.message}>
                <input id="pf-optvals" className={input} placeholder="Pautado, Pontilhado, Sem pauta" {...register('optionValues')} />
              </Field>
            </div>
          </div>

          <div className={section}>
            <h3 className="text-[19px]">Visibilidade</h3>
            <label className="flex min-h-[32px] cursor-pointer items-center gap-[10px] text-base"><input type="checkbox" {...register('active')} />Mostrar na loja</label>
            <label className="flex min-h-[32px] cursor-pointer items-center gap-[10px] text-base"><input type="checkbox" {...register('featured')} />Destacar em “Os mais pedidos” na página inicial</label>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 bg-surface px-4 py-3">
          {product && (
            <button type="button" className="btn btn-ghost text-accent-2-700 hover:text-accent-2-700" onClick={() => setConfirming(true)}>
              <Trash weight="duotone" size={18} />Excluir
            </button>
          )}
          <span className="mr-auto" />
          <button type="button" className="btn btn-secondary min-h-[44px]" onClick={onClose}>Cancelar</button>
          <button type="submit" form="product-form" className="btn btn-primary min-h-[44px] px-[20px] text-[15px]" disabled={isSubmitting || upload.isPending}>
            Salvar produto
          </button>
        </div>
      </aside>

      {confirming && product && (
        <ConfirmDialog
          title="Excluir produto?"
          body={`“${product.name}” sai do catálogo e da loja. Essa ação não pode ser desfeita.`}
          cta="Excluir produto"
          busy={remove.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
