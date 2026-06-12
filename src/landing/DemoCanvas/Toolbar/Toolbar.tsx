import { Panel } from "@xyflow/react";
import type { ComponentType } from "react";
import type { EventName } from "@/metrics/events";
import { track } from "@/metrics/track";
import { AtIcon, CodeIcon, LetterTIcon, MouseIcon, PencilIcon, SparklesIcon } from "./icons";
import styles from "./Toolbar.module.css";

interface ToolDef {
  label: string;
  hotkey: string;
  Icon: ComponentType<{ className?: string }>;
  event: EventName;
}

// Mirrors the desktop app's toolbar; visual only — these buttons place nodes in
// the product, but here they're a static advertisement of the available tools.
// Clicks are still counted: they signal visitors expecting the toolbar to work.
const tools: ToolDef[] = [
  { label: "Query", hotkey: "Q", Icon: CodeIcon, event: "demo.tool.query" },
  { label: "Agent", hotkey: "A", Icon: SparklesIcon, event: "demo.tool.agent" },
  { label: "Text", hotkey: "T", Icon: LetterTIcon, event: "demo.tool.text" },
  { label: "Variable", hotkey: "V", Icon: AtIcon, event: "demo.tool.variable" },
  { label: "Draw", hotkey: "D", Icon: PencilIcon, event: "demo.tool.draw" },
];

export function Toolbar() {
  return (
    <Panel position='bottom-center'>
      <div className={styles.toolbar}>
        <button
          type='button'
          className={`${styles.btn} ${styles.active}`}
          title='Select (Esc)'
          onClick={() => track("demo.tool.select")}
        >
          <MouseIcon />
          <span className={styles.kbd}>Esc</span>
        </button>
        <span className={styles.sep} />
        {tools.map(({ label, hotkey, Icon, event }) => (
          <button
            key={label}
            type='button'
            className={styles.btn}
            title={`${label} (${hotkey})`}
            onClick={() => track(event)}
          >
            <Icon />
            <span className={styles.kbd}>{hotkey}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
