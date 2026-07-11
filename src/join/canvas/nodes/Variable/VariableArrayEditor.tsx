"use client";

// Mantine-free port: the Popover becomes an in-node absolute dropdown, which
// also inherits the canvas zoom instead of rendering at screen scale.

import { useEffect, useRef, useState } from "react";
import { useSyncedFieldValue } from "../../hooks/useSyncedFieldValue";

export function VariableArrayEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [text, setText] = useSyncedFieldValue(value.join("\n"));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const count = value.length;
  const label = count === 0 ? "empty" : `${count} ${count === 1 ? "value" : "values"}`;

  useEffect(() => {
    if (!opened) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpened(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpened(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [opened]);

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type='button'
        className={`variable-array-chip ${count === 0 ? "empty" : ""}`}
        onClick={() => setOpened(o => !o)}
      >
        {label}
      </button>
      {opened && (
        <div
          className='variable-array-dropdown nodrag'
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 100,
            background: "var(--pk-node-bg)",
            border: "1px solid var(--pk-node-border)",
            borderRadius: "var(--pk-radius-card)",
            boxShadow: "var(--pk-node-shadow)",
            padding: 6,
          }}
        >
          <textarea
            className='variable-array-textarea nodrag'
            value={text}
            placeholder='one value per line'
            autoComplete='off'
            spellCheck={false}
            autoFocus
            onChange={e => {
              setText(e.currentTarget.value);
              onChange(e.currentTarget.value.split("\n"));
            }}
          />
        </div>
      )}
    </div>
  );
}
