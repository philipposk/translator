"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="tr-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="tr-modal-title">
      <div className="tr-modal glass">
        <h2 id="tr-modal-title" style={{ margin: "0 0 0.5rem", fontSize: "1.05rem", fontWeight: 700 }}>{title}</h2>
        <p style={{ margin: "0 0 1.25rem", color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
