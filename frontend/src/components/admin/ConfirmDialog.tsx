'use client';

type Props = { title: string; body: string; cta: string; onConfirm: () => void; onCancel: () => void; busy?: boolean };

export function ConfirmDialog({ title, body, cta, onConfirm, onCancel, busy = false }: Props) {
  return (
    <div className="dialog-backdrop z-[60] animate-fade">
      <div className="dialog bg-bg" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body">
        <div id="confirm-title" className="dialog-title text-[22px]">{title}</div>
        <div id="confirm-body" className="dialog-body text-base">{body}</div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-primary border-accent-2-600 bg-accent-2-600 hover:bg-accent-2-700" onClick={onConfirm} disabled={busy}>
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}
