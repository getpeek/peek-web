import { SectionHeading } from "../SectionHeading/SectionHeading";
import { FeatureVideo } from "./FeatureVideo/FeatureVideo";
import styles from "./Feature.module.css";

export function Feature() {
  return (
    <section className={styles.section} id='features'>
      <div className={styles.container}>
        <div className={styles.feature}>
          <div className={styles.heading}>
            <SectionHeading accent='blue'>
              Performant, even at <em>10k rows</em>.
            </SectionHeading>
            <p className={styles.sub}>
              Peek doesn't waste time rendering things you can't see.{" "}
              <strong>Nodes out of view are hidden</strong> and all{" "}
              <strong>results are virtualized</strong> allowing you to query big datasets without a
              drop in performance.
            </p>
          </div>
          <FeatureVideo src='/casts/fps.webm' label='Play the performance demo' />
        </div>

        <div className={styles.feature}>
          <div className={styles.heading}>
            <SectionHeading accent='mauve'>
              Bring your own <em>AI</em>.
            </SectionHeading>
            <p className={styles.sub}>
              Peek offers local inference. Download your favorite huggingface model and use it with
              Peek. <strong>Your schema, data and chats never leave your machine</strong>, and you
              don't have to worry about rate limits.
            </p>
          </div>
          <FeatureVideo src='/casts/agent.webm' label='Play the local AI demo' />
        </div>

        <div className={styles.feature}>
          <div className={styles.heading}>
            <SectionHeading accent='blue'>
              Fully <em>agentic ready</em>.
            </SectionHeading>
            <p className={styles.sub}>
              Enable Peek&apos;s MCP and <strong>let Claude Code take the wheel</strong>. Your
              favorite agent can create queries, pages and analyze results, and even move the
              camera.
            </p>
          </div>
          <FeatureVideo src='/casts/mcp.webm' label='Play the agentic MCP demo' />
        </div>

        <div className={styles.feature}>
          <div className={styles.heading}>
            <SectionHeading accent='mauve'>
              Ready <em>player two</em>.
            </SectionHeading>
            <p className={styles.sub}>
              Share a private link with your team,{" "}
              <strong>they can instantly join your session and collaborate in real-time</strong>.
              Fully P2P, no centralized server and nothing is shared with Peek itself.
            </p>
          </div>
          <FeatureVideo label='Play the multiplayer demo' />
        </div>

        <div className={styles.feature}>
          <div className={styles.heading}>
            <SectionHeading accent='mauve'>
              Bring your own <em>data.</em>
            </SectionHeading>
            <p className={styles.sub}>
              Drag &amp; drop a <strong>CSV, JSON, Parquet or SQL</strong> file in Peek. Peek will
              automatically create a temporary connection-scoped table and let you{" "}
              <strong>query your file as if it was in your database</strong>. You can even join it
              against other tables.
            </p>
          </div>
          <FeatureVideo src='/casts/bring-your-own-data.webm' label='Play the file import demo' />
        </div>

        <div className={styles.feature}>
          <div className={styles.heading}>
            <SectionHeading accent='yellow'>
              Click. Type. <em>Commit.</em>
            </SectionHeading>
            <p className={styles.sub}>
              Double click any cell to edit inline. <strong>Peek understands your db schema</strong>{" "}
              and knows when to present a dropdown or a JSON editor
            </p>
          </div>
          <FeatureVideo src='/casts/edit.webm' label='Play the inline editing demo' />
        </div>
      </div>
    </section>
  );
}
