"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="dialog">
        <h3 id="confirm-title">{title}</h3>
        <p className="muted">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
