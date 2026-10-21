import { useEffect, useId, useRef, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { Button } from 'sectei-library';
import './confirm-dialog.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  danger = false,
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // A page can hold several dialogs (e.g. delete survey / delete edition), so ids must be unique.
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      document.body.classList.add('overflow-hidden');
    } else if (dialog.open) {
      dialog.close();
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  const handleCancel = (event: FormEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (!confirming) onCancel();
  };

  const handleClickDialog = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current && !confirming) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={handleCancel}
      onClick={handleClickDialog}
    >
      <div className="modal-container confirm-dialog__container">
        <h2 id={titleId} className="confirm-dialog__title">
          {title}
        </h2>
        <div id={messageId} className="confirm-dialog__message">
          {message}
        </div>
        <div className="confirm-dialog__actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={confirming}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            className={danger ? 'confirm-dialog__confirm confirm-dialog__confirm--danger' : 'confirm-dialog__confirm'}
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Procesando…' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
