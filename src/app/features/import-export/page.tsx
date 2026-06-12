import type { Metadata } from "next";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { FeatureVideo } from "@/landing/Feature/FeatureVideo/FeatureVideo";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Import / Export" };

export default function ImportExportPage() {
  return (
    <>
      <h1 className={styles.title}>Import / Export</h1>
      <p className={styles.lede}>
        Bring data in from CSV and JSON, send results out to anywhere - without leaving the canvas.
      </p>

      <FeatureVideo src='/casts/bring-your-own-data.webm' label='Play the file import demo' />

      <DocsSection slug='import' title='Drop a file, get a table' level={2}>
        <p>
          Drag a <strong>CSV</strong> or <strong>JSON</strong> file onto the canvas and Peek imports
          it into your active connection as a table, then drops a query node right where you
          released it - pre-filled with <code>SELECT * FROM your_file</code> and ready to run.
        </p>
        <p>
          From there it behaves like any other table:{" "}
          <strong>join it against your real data</strong>, filter it, feed it into a chart. Column
          and table names are normalized automatically, so a file like <code>Sales Q1.csv</code>{" "}
          becomes a clean <code>sales_q</code> table you can query straight away.
        </p>
      </DocsSection>

      <DocsSection slug='export' title='Send results anywhere' level={2}>
        <p>
          Every Result node is a jumping-off point. Right-click a cell to copy its value, or copy
          and export whole rows - single rows, or a multi-row selection - as{" "}
          <strong>JSON, CSV, or SQL inserts</strong>. Right-click a column header to{" "}
          <strong>export that column</strong> in the same formats, or turn it straight into a
          variable.
        </p>
        <p>
          Need to export entire result sets at once? The command palette&apos;s{" "}
          <strong>Export selected data</strong> writes every selected Result node to a folder as CSV
          or JSON - and, since you&apos;re already running a local model, it names each file
          descriptively from the query that produced it.
        </p>
      </DocsSection>
    </>
  );
}
