import type { Metadata } from "next";
import Image from "next/image";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { Kbd } from "@/docs/Kbd/Kbd";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Schema Explorer" };

export default function SchemaExplorerPage() {
  return (
    <>
      <h1 className={styles.title}>Schema Explorer</h1>
      <p className={styles.lede}>
        See your whole database at once. The schema explorer puts all your table definitions on a
        new page and links them, so you can visually follow your references across tables.
      </p>

      <p>
        Run <strong>View schema</strong> from the command palette (<Kbd>meta + p</Kbd>) and Peek
        introspects the active connection
      </p>

      <Image
        className={styles.fullImage}
        src='/features/schema-explorer.png'
        alt='Schema explorer'
        width={1200}
        height={800}
      />

      <DocsSection slug='like-any-page' title='Like any other page' level={2}>
        <p>
          Peek opens up a new, dedicated, schema page for you, and drops the graph there. Meaning
          you can keep working from there, place query or ai nodes. Or just use the draw tool to
          annotate your schema.
        </p>
      </DocsSection>

      <DocsSection slug='keys-types' title='Keys and types at a glance' level={2}>
        <p>
          Every column carries its type, colour-coded by family - numbers, text, booleans, dates and
          times, JSON, UUIDs, and binary each read differently - so the makeup of a table is obvious
          without squinting at <code>varchar</code> versus <code>int8</code>.
        </p>
        <p>
          Peek tags <strong>primary keys</strong> with a <code>PK</code> badge and{" "}
          <strong>foreign keys</strong> with an <code>FK</code> badge, inferring them from the
          database&apos;s declared constraints and from common conventions like an <code>id</code>{" "}
          column or a trailing <code>_id</code>. The keys that stitch your tables together are the
          first thing you see.
        </p>
      </DocsSection>

      <DocsSection slug='relationships' title='Follow the relationships' level={2}>
        <p>
          Foreign-key relationships are drawn as edges between tables, derived straight from the
          schema&apos;s references - so the lines always reflect the real constraints rather than
          anything you wired by hand. Self-references and duplicates are folded away to keep the
          diagram clean.
        </p>
        <p>
          Select a table and its connections light up: the edges leaving and entering it glow, and
          the tables on the other end are highlighted, so you can trace what a given table touches
          without losing it in the tangle.
        </p>
      </DocsSection>

      <DocsSection slug='jump' title='Jump to any table' level={2}>
        <p>
          On a large schema the command palette becomes a table of contents. While the schema page
          is open, every table shows up by name - search for one, hit <Kbd>Enter</Kbd>, and Peek
          selects it and flies the camera straight to it. Finding <code>orders</code> in a hundred
          tables is two keystrokes, not a scroll hunt.
        </p>
      </DocsSection>
    </>
  );
}
