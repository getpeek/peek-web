import type { Metadata } from "next";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { Kbd } from "@/docs/Kbd/Kbd";
import styles from "@/docs/DocsContent/DocsContent.module.css";

export const metadata: Metadata = { title: "Configuration" };

export default function ConfigurationPage() {
  return (
    <>
      <h1 className={styles.title}>Configuration</h1>
      <p className={styles.lede}>Tailor Peek to the way you and your team work.</p>

      <DocsSection slug='workspaces' title='Workspaces' level={2}>
        <p>Group connections, queries, and canvases into a workspace.</p>
        <div className={styles.placeholder}>Design this section next — workspaces</div>
      </DocsSection>

      <DocsSection slug='connections' title='Connections' level={3}>
        <p>Add and manage database connections inside a workspace.</p>
        <div className={styles.placeholder}>Design this section next — connections</div>
      </DocsSection>

      <DocsSection slug='themes' title='Themes' level={2}>
        <p>
          Peek comes with three themes, two dark themes <em>Pine</em> and <em>Midnight</em>, and a
          light theme <em>Midday</em>. You can set your theme by using the command palette{" "}
          <Kbd>meta + p</Kbd> and typing <em>theme</em>.
        </p>
        <p>
          You can also set the theme in your <code>~/peek/settings.json</code> by updating the{" "}
          <code>theme</code> key.
          <code>
            {` {
              "theme": "Pine"
            }`}
          </code>
        </p>
      </DocsSection>

      <DocsSection slug='ai' title='AI' level={2}>
        <p>Bring your own key and turn plain English into SQL.</p>
        <div className={styles.placeholder}>Design this section next — AI overview</div>
      </DocsSection>

      <DocsSection slug='agent' title='Agent' level={3}>
        <p>Let an agent explore your schema and write queries.</p>
        <div className={styles.placeholder}>Design this section next — agent</div>
      </DocsSection>

      <DocsSection slug='mcp' title='MCP' level={3}>
        <p>Connect Peek to an MCP endpoint.</p>
        <div className={styles.placeholder}>Design this section next — MCP</div>
      </DocsSection>

      <DocsSection slug='multiplayer' title='Multiplayer' level={2}>
        <p>Share a canvas and collaborate live.</p>
        <div className={styles.placeholder}>Design this section next — multiplayer</div>
      </DocsSection>
    </>
  );
}
