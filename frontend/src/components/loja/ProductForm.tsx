'use client';

import { Heart } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { chipClass } from '@/components/ui/chip';
import { Field } from '@/components/ui/Field';
import { QtyStepper } from '@/components/ui/QtyStepper';
import type { Product } from '@/lib/api/types';
import { useCart } from '@/lib/cart/store';

export function ProductForm({ product }: { product: Product }) {
  const min = product.minQuantity ?? 1;
  const hasOptions = Boolean(product.optionName) && product.optionValues.length > 0;
  const [option, setOption] = useState<string | null>(hasOptions ? product.optionValues[0] : null);
  const [text, setText] = useState('');
  const [obs, setObs] = useState('');
  const [qty, setQty] = useState(min);
  const [added, setAdded] = useState(false);

  const change = <T,>(setter: (v: T) => void) => (value: T) => { setter(value); setAdded(false); };

  const addToCart = () => {
    const cart = useCart.getState();
    cart.add({ productId: product.id, qty, option: hasOptions ? option : null, text: text.trim(), obs: obs.trim() });
    setText('');
    setObs('');
    setAdded(true);
    if (window.matchMedia('(min-width: 1040px)').matches) cart.setOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {hasOptions && (
        <div className="field">
          <label id="product-option">{product.optionName}</label>
          <div role="radiogroup" aria-labelledby="product-option" className="flex flex-wrap gap-2">
            {product.optionValues.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={option === value}
                className={chipClass(option === value)}
                onClick={() => change(setOption)(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
      <Field label={product.customFieldLabel} htmlFor="product-text">
        <input
          id="product-text"
          className="input min-h-[44px] text-base"
          value={text}
          maxLength={200}
          placeholder={product.customFieldPlaceholder}
          onChange={(e) => change(setText)(e.target.value)}
        />
      </Field>
      <Field label="Tema, cores ou referências (opcional)" htmlFor="product-obs">
        <textarea
          id="product-obs"
          className="input min-h-[80px] text-base"
          value={obs}
          maxLength={500}
          placeholder="Ex.: tons de lilás, tema jardim, igual à foto…"
          onChange={(e) => change(setObs)(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper
          value={qty}
          onDecrement={() => change(setQty)(Math.max(min, qty - 1))}
          onIncrement={() => change(setQty)(qty + 1)}
        />
        <button type="button" className="btn btn-primary min-h-[46px] flex-[1_1_220px] text-base" onClick={addToCart}>
          <Heart weight="duotone" size={18} /> Adicionar à minha lista
        </button>
      </div>
      {added && (
        <p role="status" className="animate-fade text-sm text-accent-700">
          Adicionado! Continue escolhendo ou abra sua lista para enviar.
        </p>
      )}
    </div>
  );
}
