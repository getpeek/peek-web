import { keyIcons } from "./keyIcons";
import styles from "./Kbd.module.css";

// Word aliases → the canonical symbol used to look up keyIcons. Lets callers
// write readable combos like `meta + p`; symbols (⌘, arrows) and anything
// unmapped (letters, brackets, "esc") pass straight through.
const aliases: Record<string, string> = {
  meta: "⌘",
  cmd: "⌘",
  command: "⌘",
  shift: "⇧",
  ctrl: "⌃",
  control: "⌃",
  backspace: "⌫",
  delete: "⌫",
  del: "⌫",
};

function resolveKey(token: string) {
  const symbol = aliases[token.toLowerCase()] ?? token;
  const icon = keyIcons[symbol];
  if (icon) {
    return { content: icon.icon, label: icon.label, isIcon: true };
  }
  // single letters read better capitalized ("p" → "P"); leave words ("esc") alone
  const text = token.length === 1 ? token.toUpperCase() : token;
  return { content: text, label: text, isIcon: false };
}

// A keyboard shortcut, written as a `+`-separated string: `<Kbd>meta + p</Kbd>`.
// Each token becomes its own key cap; modifier words render as icons.
export function Kbd({ children }: { children: string }) {
  const tokens = children
    .split("+")
    .map(token => token.trim())
    .filter(Boolean);

  return (
    <span className={styles.combo}>
      {tokens.map((token, index) => {
        const { content, label, isIcon } = resolveKey(token);
        return (
          <kbd
            key={`${token}-${index}`}
            className={styles.key}
            aria-label={isIcon ? label : undefined}
          >
            {content}
          </kbd>
        );
      })}
    </span>
  );
}
