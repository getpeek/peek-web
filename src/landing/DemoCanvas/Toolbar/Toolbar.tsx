import { Panel } from "@xyflow/react";
import type { ComponentType } from "react";
import { AtIcon, CodeIcon, LetterTIcon, MouseIcon, PencilIcon, SparklesIcon } from "./icons";
import styles from "./Toolbar.module.css";

interface ToolDef {
  label: string;
  hotkey: string;
  Icon: ComponentType<{ className?: string }>;
}

// Mirrors the desktop app's toolbar; visual only — these buttons place nodes in
// the product, but here they're a static advertisement of the available tools.
const tools: ToolDef[] = [
  { label: "Query", hotkey: "Q", Icon: CodeIcon },
  { label: "Agent", hotkey: "A", Icon: SparklesIcon },
  { label: "Text", hotkey: "T", Icon: LetterTIcon },
  { label: "Variable", hotkey: "V", Icon: AtIcon },
  { label: "Draw", hotkey: "D", Icon: PencilIcon },
];

export function Toolbar() {
  return (
    <Panel position='bottom-center'>
      <div className={styles.toolbar}>
        <button type='button' className={`${styles.btn} ${styles.active}`} title='Select (Esc)'>
          <MouseIcon />
          <span className={styles.kbd}>Esc</span>
        </button>
        <span className={styles.sep} />
        {tools.map(({ label, hotkey, Icon }) => (
          <button key={label} type='button' className={styles.btn} title={`${label} (${hotkey})`}>
            <Icon />
            <span className={styles.kbd}>{hotkey}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
