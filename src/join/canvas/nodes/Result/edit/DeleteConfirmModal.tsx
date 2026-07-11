"use client";

// Mantine-free port of the desktop modal. Inert in practice on the web guest
// (queryInfo reports nothing editable) but kept functional to minimize drift.

import { createPortal } from "react-dom";

export function DeleteConfirmModal({
  opened,
  rowCount,
  table,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  opened: boolean;
  rowCount: number;
  table: string | null;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!opened) {
    return null;
  }
  const noun = rowCount === 1 ? "row" : "rows";
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5500,
        display: "grid",
        placeItems: "center",
        background: "rgb(0 0 0 / 45%)",
      }}
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        style={{
          width: 340,
          background: "var(--pk-node-bg)",
          border: "1px solid var(--pk-node-border)",
          borderRadius: "var(--pk-radius-card)",
          boxShadow: "var(--pk-node-shadow)",
          color: "var(--pk-fg)",
          font: "500 13px var(--pk-font-sans)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <strong>{`Delete ${rowCount} ${noun}?`}</strong>
        <span>
          {table ? (
            <>
              This will permanently delete {rowCount} {noun} from <strong>{table}</strong>. This
              cannot be undone.
            </>
          ) : (
            <>
              This will permanently delete {rowCount} {noun}. This cannot be undone.
            </>
          )}
        </span>
        {error && <span style={{ color: "var(--pk-red)", fontSize: 11 }}>{error}</span>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type='button' className='icon-btn' onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type='button'
            className='icon-btn'
            style={{ color: "var(--pk-red)" }}
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
