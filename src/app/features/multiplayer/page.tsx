import type { Metadata } from "next";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { FeatureVideo } from "@/landing/Feature/FeatureVideo/FeatureVideo";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "Multiplayer" };

export default function MultiplayerPage() {
  return (
    <>
      <h1 className={styles.title}>Multiplayer</h1>
      <p className={styles.lede}>
        Explore together. Live cursors, shared canvases, and branching side-by-side with your team -
        fully peer-to-peer, so your data never touches a server.
      </p>

      <FeatureVideo label='Play the multiplayer demo' />

      <DocsSection slug='host-and-join' title='Host a session, share a ticket' level={2}>
        <p>
          One person <strong>hosts</strong> a session and gets a <strong>ticket</strong> - a short
          string (or a <code>peek://invite/…</code> deep link) that carries everything needed to
          dial their machine. Anyone who pastes it <strong>joins</strong>, mirrors the host&apos;s
          canvas, and starts editing alongside them in real time. There&apos;s no account to make
          and nothing to install on their end.
        </p>
      </DocsSection>

      <DocsSection slug='p2p' title='Peer-to-peer, end to end' level={2}>
        <p>
          Sessions are built on{" "}
          <a href='https://www.iroh.computer/' target='_blank' rel='noopener'>
            iroh
          </a>
          . Peek runs <strong>no central server</strong> that routes your edits - pages, nodes,
          cursors, and presence all flow directly between the people in the session. That&apos;s
          what makes it safe to look at real data together: there&apos;s no middle tier for Peek to
          read it from.
        </p>
        <p>
          Each peer keeps its own pan, zoom, and active page, so you can wander off to inspect a
          different node without yanking everyone else&apos;s view along with you. Cursors are
          filtered per page, so you only see pointers from people looking at the same canvas.
        </p>
      </DocsSection>

      <DocsSection slug='queries' title='One database, shared results' level={2}>
        <p>
          Queries always run against the <strong>host&apos;s</strong> connection. When a guest runs
          a query, the request goes to the host, executes there, and the rows stream back - so
          everyone sees the same results without the guest ever holding your credentials.
        </p>
        <p>
          The host&apos;s schema is shared along with the canvas, so guests get full autocomplete
          and SQL intelligence even though they have{" "}
          <strong>no database connection of their own</strong>. The connection stays opaque to them
          - they only ever see its name.
        </p>
      </DocsSection>

      <DocsSection slug='ending' title='End it cleanly' level={2}>
        <p>
          When the host ends a session, the shared document is torn down and the host&apos;s dialing
          address is rotated, so <strong>old tickets stop working</strong> - a previously shared
          link can&apos;t be used to reconnect later. Guests fall back to a local snapshot of where
          things were when the session closed.
        </p>
      </DocsSection>
    </>
  );
}
