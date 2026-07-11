import type { Metadata } from "next";
import Image from "next/image";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { Kbd } from "@/docs/Kbd/Kbd";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Nodes" };

export default function NodesPage() {
  return (
    <>
      <h1 className={styles.title}>Nodes</h1>
      <p className={styles.lede}>
        Everything on the canvas is a node. Each node type has a focused purpose - compose them
        freely to build up your data workflow.
      </p>

      <DocsSection slug='query' title='Query' level={2}>
        <p>
          A Query node is where you write SQL. It holds a single statement, runs against the active
          connection, and sends its output to any connected Result node.
        </p>
        <p>
          Press <Kbd>meta</Kbd> <Kbd>S</Kbd> to format the query, <Kbd>meta</Kbd> <Kbd>Enter</Kbd>{" "}
          to execute, or click the run button in the node header. The last run time and row count
          are shown inline so you always know the result age.
        </p>
        <p>
          Query nodes support <strong>variable interpolation</strong> - any{" "}
          <strong>Variable</strong> node wired into a Query node replaces the matching{" "}
          <code>@name</code> placeholder at run time.
        </p>
        <Image
          className={styles.fullImage}
          src='/tools/query.png'
          alt='Query node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='result' title='Result' level={2}>
        <p>
          A Result node displays the tabular output of a connected Query node. Hold <Kbd>shift</Kbd>{" "}
          while dragging over results to select multiple nodes.
        </p>
        <p>
          Right click a cell to copy its value, or create a variable node pre-populated with the
          cell value. You can also right click column headers to export the column data or use the
          entire column as a variable.
        </p>
        <p>
          Result nodes can be wired to agent nodes to explicitly give the agent result data, which
          is disabled by default to avoid leaking data to AI agents.
        </p>
        <Image
          className={styles.fullImage}
          src='/tools/result.png'
          alt='Result node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='agent' title='Agent' level={2}>
        <p>
          An Agent node opens a conversation with Peek&apos;s AI assistant. You can ask it to write
          a query, explain a result, suggest an index, or reason over anything else on the canvas.
        </p>
        <p>
          The agent is canvas-aware - it can read the SQL in connected Query nodes and the schema of
          the active connection, as well as create pages, update nodes and move the camera. It never
          receives raw query results unless you explicitly wire it into the chat, so sensitive row
          data stays off the wire.
        </p>
        <p>
          One thing agents can&apos;t do is execute queries, so you don&apos;t have to worry about
          them running amok on your data.
        </p>
        <Image
          className={styles.fullImage}
          src='/tools/agent.png'
          alt='Agent node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='chart' title='Chart' level={2}>
        <p>
          A Chart node turns a Result into a visualisation. Any Result node that has chartable data,
          i.e. columns with numeric values, can spawn a chart node.
        </p>
        <p>
          Chart nodes show bar charts by default, but other chart options are available to switch to
          in the Chart node toolbar.
        </p>
        <Image
          className={styles.fullImage}
          src='/tools/chart.png'
          alt='Chart node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='variable' title='Variable' level={2}>
        <p>
          A Variable node holds one or more named rows - a date range, a user ID, a status string.
          Reference any of them in SQL with the <code>@</code>-syntax, like{" "}
          <code>{"WHERE created_at > @start_date"}</code>. The name must be a valid identifier and
          is matched exactly - <code>@start_date</code> is case-sensitive - and Peek is careful
          about where it substitutes, so an email like <code>users@example.com</code> is never
          mistaken for a variable.
        </p>
        <p>
          Variables reach a query <strong>through an edge</strong>: wire a Variable node into a
          Query node and its values become available there. Change a value once and{" "}
          <strong>every connected query picks it up</strong>, so re-running an entire analysis with
          a new ID or date is a single edit.
        </p>
        <p>
          Flip a row into <strong>array</strong> mode with the brackets toggle and it holds a list
          instead of a single value. Lists expand to a comma-separated sequence at run time, which
          makes <code>{"WHERE id IN (@ids)"}</code> queries effortless - no hand-assembling values.
        </p>
        <p>
          Toggle a Variable node <strong>global</strong> and it wires itself to{" "}
          <strong>every Query node on the canvas - including ones you add later</strong>. It&apos;s
          the easiest way to set a shared <code>@tenant_id</code> or environment value once and have
          the whole canvas honor it automatically.
        </p>
        <Image
          className={styles.fullImage}
          src='/tools/variables.png'
          alt='Variable node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='draw' title='Draw' level={2}>
        <p>
          A Draw node gives you a freehand drawing surface directly on the canvas. Sketch a diagram,
          circle an anomaly in a result set, or annotate a section of your workflow with a quick
          illustration.
        </p>
        <p>
          Drawings are vector paths stored in the node, so they stay crisp at any zoom level and
          move with the canvas like any other node.
        </p>
        <Image
          className={styles.fullImage}
          src='/tools/draw.png'
          alt='Draw node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='text' title='Text' level={2}>
        <p>
          A Text node is a freeform note. Use it to document a canvas, label a section of the
          workflow, or leave a comment for a collaborator.
        </p>
        <p>
          Text nodes have no connections and do not affect query execution; they exist purely for
          human context.
        </p>
        <Image
          className={styles.fullImage}
          src='/tools/text.png'
          alt='Text node'
          width={1168}
          height={657}
        />
      </DocsSection>
    </>
  );
}
