import type { Metadata } from "next";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { FeatureVideo } from "@/landing/Feature/FeatureVideo/FeatureVideo";
import { Kbd } from "@/docs/Kbd/Kbd";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Editing Data" };

export default function EditingDataPage() {
  return (
    <>
      <h1 className={styles.title}>Editing Data</h1>
      <p className={styles.lede}>
        Edit rows inline, right in the result node - with full awareness of constraints and types,
        explicit commits, and a confirmation step before destructive writes.
      </p>

      <FeatureVideo src='/casts/edit.webm' label='Play the inline editing demo' />

      <DocsSection slug='inline' title='Edit right in the result' level={2}>
        <p>
          Double-click any cell in a Result node to edit it in place. Change the value, press{" "}
          <Kbd>meta + s</Kbd> to commit, or <Kbd>esc</Kbd> to back out. Peek builds the{" "}
          <code>UPDATE</code> for you, runs it, and re-runs the query so the cell you&apos;re
          looking at always reflects what&apos;s actually in the database.
        </p>
        <p>
          Editing is keyed off the primary key, so it works on any{" "}
          <strong>single-table SELECT from a table with a primary key</strong>. If a query
          can&apos;t be safely edited - a join, an aggregate, a table with no key - Peek tells you
          inline instead of writing something ambiguous.
        </p>
      </DocsSection>

      <DocsSection slug='schema-aware' title='Schema-aware inputs' level={2}>
        <p>
          Peek understands your column types and gives you the right control for each one. A{" "}
          <strong>boolean</strong> becomes a TRUE / FALSE / NULL dropdown, a{" "}
          <strong>JSON or JSONB</strong> column opens a multi-line editor, and numeric columns get a
          number input. There&apos;s a dedicated <strong>NULL</strong> button to clear a value, and
          types are cast correctly as the statement is built.
        </p>
        <p>
          You can even reference a <strong>variable</strong> while editing - type <code>@name</code>{" "}
          in a cell and Peek substitutes the value from any connected Variable node before writing.
        </p>
      </DocsSection>

      <DocsSection slug='insert-delete' title='Insert and delete, deliberately' level={2}>
        <p>
          Add new rows straight from the Result node, with the same schema-aware inputs you get when
          editing. Select one or more rows and delete them too - but only after a{" "}
          <strong>confirmation step</strong> that shows exactly which table and how many rows are
          about to go, so a destructive write is never a single misclick.
        </p>
      </DocsSection>
    </>
  );
}
