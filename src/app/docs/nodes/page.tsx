import type { Metadata } from "next";
import Image from "next/image";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";
import { Kbd } from "@/docs/Kbd/Kbd";
import nodeStyles from "./Nodes.module.css";

export const metadata: Metadata = { title: "Nodes" };

export default function NodesPage() {
  return (
    <>
      <h1 className={styles.title}>Nodes</h1>
      <p className={styles.lede}>
        Everything on the canvas is a node. Each node type has a focused purpose — compose them
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
          Query nodes support <strong>variable interpolation</strong> — any{" "}
          <strong>Variable</strong> node wired into a Query node replaces the matching{" "}
          <code>@name</code> placeholder at run time.
        </p>
        <Image
          className={nodeStyles.nodeImage}
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
          Right click a cell to copy it's value, or create a variable node pre-populated with the
          cell value. You can also right click column headers to export the column data or use the
          entire column as a variable.
        </p>
        <p>
          Result nodes can be wired to agent nodes to explicitly give the agent result data, which
          is disabled by default to avoid leaking data to AI agents.
        </p>
        <Image
          className={nodeStyles.nodeImage}
          src='/tools/result.png'
          alt='Result node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='agent-node' title='Agent' level={2}>
        <p>
          An Agent node opens a conversation with Peek's AI assistant. You can ask it to write a
          query, explain a result, suggest an index, or reason over anything else on the canvas.
        </p>
        <p>
          The agent is canvas-aware - it can read the SQL in connected Query nodes and the schema of
          the active connection, as well as create pages, update nodes and move the camera. It never
          receives raw query results unless you explicitly wire it intointo the chat, so sensitive
          row data stays off the wire.
        </p>
        <p>
          One thing agents can't do is execute queries, so you don't have to worry about them
          running amok on your data.
        </p>
        <Image
          className={nodeStyles.nodeImage}
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
          in Chart node toolbar.
        </p>
        <Image
          className={nodeStyles.nodeImage}
          src='/tools/chart.png'
          alt='Chart node'
          width={1168}
          height={657}
        />
      </DocsSection>

      <DocsSection slug='variable' title='Variable' level={2}>
        <p>
          A Variable node holds a named value — a date range, a user ID, a status string - that can
          be injected into one or more Query nodes. Change the value once and every connected query
          automotatically gets the new value.
        </p>
        <p>
          Variable values can also be arrays, to simplify <code>WHERE ... IN (@ids)</code> queries
        </p>
        . Just click the array button on the varable to turn it from a value to a list
        <p>
          Reference a variable in SQL with the @-syntax:
          <code>{"WHERE created_at > @start_date"}</code>. The variable name must match the node
          label exactly (case-sensitive).
        </p>
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
          className={nodeStyles.nodeImage}
          src='/tools/text.png'
          alt='Text node'
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
          className={nodeStyles.nodeImage}
          src='/tools/draw.png'
          alt='Draw node'
          width={1168}
          height={657}
        />
      </DocsSection>
    </>
  );
}
