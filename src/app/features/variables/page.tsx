import type { Metadata } from "next";
import Image from "next/image";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Variables" };

export default function VariablesPage() {
  return (
    <>
      <h1 className={styles.title}>Variables</h1>
      <p className={styles.lede}>
        Define a value once, reference it across every query on the canvas, and re-run the whole
        flow with a single change.
      </p>

      <Image
        className={styles.fullImage}
        src='/tools/variables.png'
        alt='A Variable node wired into query nodes on the canvas'
        width={1168}
        height={657}
      />

      <DocsSection slug='define-once' title='Define once, reference everywhere' level={2}>
        <p>
          A Variable node holds one or more named rows - a date range, a user ID, a status string.
          Reference any of them in SQL with the <code>@</code>-syntax, like{" "}
          <code>{"WHERE created_at > @start_date"}</code>. The name must be a valid identifier, and
          Peek is careful about where it substitutes - an email like <code>users@example.com</code>{" "}
          is never mistaken for a variable.
        </p>
        <p>
          Variables reach a query <strong>through an edge</strong>: wire a Variable node into a
          Query node and its values become available there. Change a value once and{" "}
          <strong>every connected query picks it up</strong>, so re-running an entire analysis with
          a new ID or date is a single edit.
        </p>
      </DocsSection>

      <DocsSection slug='arrays' title='Values or lists' level={2}>
        <p>
          Flip a row into <strong>array</strong> mode with the brackets toggle and it holds a list
          instead of a single value. Lists expand to a comma-separated sequence at run time, which
          makes <code>{"WHERE id IN (@ids)"}</code> queries effortless - no hand-assembling values.
        </p>
      </DocsSection>

      <DocsSection slug='global' title='Local or global' level={2}>
        <p>
          Toggle a Variable node <strong>global</strong> and it wires itself to{" "}
          <strong>every Query node on the canvas - including ones you add later</strong>. It&apos;s
          the easiest way to set a shared <code>@tenant_id</code> or environment value once and have
          the whole canvas honor it automatically.
        </p>
      </DocsSection>
    </>
  );
}
