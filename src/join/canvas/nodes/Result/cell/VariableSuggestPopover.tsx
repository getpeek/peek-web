import { createPortal } from "react-dom";

export function VariableSuggestPopover({
  inputEl,
  suggestions,
  selectedIdx,
  onPick,
}: {
  inputEl: HTMLInputElement | HTMLTextAreaElement;
  suggestions: string[];
  selectedIdx: number;
  onPick: (name: string) => void;
}) {
  const rect = inputEl.getBoundingClientRect();
  return createPortal(
    <div
      className='variable-suggest'
      style={{
        position: "fixed",
        top: rect.bottom + 2,
        left: rect.left,
        minWidth: rect.width,
        zIndex: 1000,
      }}
    >
      {suggestions.map((name, idx) => (
        <div
          key={name}
          className={`variable-suggest-item ${idx === selectedIdx ? "selected" : ""}`}
          onMouseDown={e => e.preventDefault()}
          onClick={() => onPick(name)}
        >
          @{name}
        </div>
      ))}
    </div>,
    document.body,
  );
}
