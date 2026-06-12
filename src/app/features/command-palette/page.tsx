import type { Metadata } from "next";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { Kbd } from "@/docs/Kbd/Kbd";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";
import Image from "next/image";

export const metadata: Metadata = { title: "Command Palette" };

export default function CommandPalettePage() {
  return (
    <>
      <h1 className={styles.title}>Command Palette</h1>
      <p className={styles.lede}>
        Every action in Peek - one keystroke away. Summon nodes, run queries, and jump anywhere on
        the canvas without leaving the keyboard.
      </p>

      <Image
        className={styles.fullImage}
        src='/features/command-palette.png'
        alt='Command palette'
        width={1168}
        height={657}
      />

      <DocsSection slug='open' title='Open from anywhere' level={2}>
        <p>
          Press <Kbd>meta + p</Kbd> to open the palette from any canvas, on any page. Start typing
          and the list filters as you go - the search is fuzzy, so <code>thm</code> finds{" "}
          <strong>Set theme to Midnight</strong> and <code>exp</code> surfaces the export commands.
          Arrow keys move the selection, <Kbd>Enter</Kbd> runs it, and <Kbd>esc</Kbd> dismisses the
          palette without touching the canvas.
        </p>
        <p>
          A preview pane sits alongside the results, so before you commit to a command you can see
          what it&apos;ll do: a theme swatch, the SQL a jump-to-query entry will land on, or the
          rows an export will write.
        </p>
      </DocsSection>

      <DocsSection slug='actions' title='Run any action' level={2}>
        <p>
          The palette gathers up the things you&apos;d otherwise hunt through menus for:{" "}
          <strong>rerun every query on the page</strong> or just the selected ones,{" "}
          <strong>organize the canvas</strong>, open a fresh page, close the current one, or jump to
          the next. It even <strong>views the full schema</strong> of the active connection on a
          dedicated page.
        </p>
        <p>
          For the nodes you reach for constantly there are direct keys too - <Kbd>Q</Kbd> drops a
          Query, <Kbd>A</Kbd> an Agent, <Kbd>V</Kbd> a Variable, <Kbd>T</Kbd> Text, and <Kbd>D</Kbd>{" "}
          Draw - but the palette is always there when a shortcut slips your mind.
        </p>
      </DocsSection>

      <DocsSection slug='jump' title='Jump straight to anything' level={2}>
        <p>
          As a canvas fills up, the palette becomes the fastest way around it. Search by name to
          <strong> jump to a page</strong>, a <strong>query node</strong>, or a{" "}
          <strong>table</strong> in your schema, and Peek pans the camera straight to it - switching
          pages first if it lives on another one.
        </p>
      </DocsSection>

      <DocsSection slug='beyond-nodes' title='More than nodes' level={2}>
        <p>
          The palette reaches the rest of the app, too. Switch between the <strong>Pine</strong>,{" "}
          <strong>Midnight</strong>, and <strong>Midday</strong> themes, point the canvas at a
          different <strong>connection</strong>, <strong>export selected results</strong> to CSV or
          JSON, or <strong>host and join a multiplayer session</strong> - all without leaving the
          keyboard.
        </p>
      </DocsSection>
    </>
  );
}
