"use client";

import { useState, type CSSProperties } from "react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  label?: string;
  onDelete: () => Promise<unknown>;
  onDeleted?: () => void;
  onError?: (message: string) => void;
  className?: string;
  style?: CSSProperties;
};

/** Destructive hard-delete — rendered only for SUPER ADMIN (backend enforces the same). */
export default function DeleteRecordButton({
  title,
  message,
  confirmLabel = "Delete permanently",
  label = "Delete",
  onDelete,
  onDeleted,
  onError,
  className = "btn btn-danger",
  style,
}: Props) {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isSuperAdmin) return null;

  return (
    <>
      <button type="button" className={className} style={style} onClick={() => setOpen(true)}>
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        danger
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await onDelete();
            setOpen(false);
            onDeleted?.();
          } catch (err) {
            onError?.(err instanceof ApiError ? err.message : "Delete failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
