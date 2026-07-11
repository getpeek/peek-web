import type { Metadata } from "next";
import { Code } from "@/components/Code/Code";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { FeatureVideo } from "@/landing/Feature/FeatureVideo/FeatureVideo";
import styles from "@/components/SubpageLayout/SubpageContent.module.css";

export const metadata: Metadata = { title: "AI Agents" };

export default function AiAgentsPage() {
  return (
    <>
      <h1 className={styles.title}>AI Agents</h1>
      <p className={styles.lede}>
        Drop an agent on the canvas, describe what you want, and watch it query, chart, and explain
        your data - with your own model, on your own machine.
      </p>

      <FeatureVideo src='/casts/agent.webm' label='Play the local AI demo' />

      <DocsSection slug='bring-your-own-model' title='Bring your own model' level={2}>
        <p>
          The Agent node talks to a model running on your own machine. Point Peek at any{" "}
          <a href='https://ollama.com/' target='_blank' rel='noopener'>
            Ollama
          </a>
          -compatible endpoint, pick the model you want, and that&apos;s it - responses stream token
          by token, your schema and chats never leave your machine, and there are no rate limits to
          work around.
        </p>
        <Code lang='json' title='~/peek/settings.json'>
          {`{
  "ai": {
    "model": "gemma4:12b",
    "url": "http://localhost:11434"
  }
}`}
        </Code>
      </DocsSection>

      <DocsSection slug='run-and-build' title='It queries, and it builds' level={2}>
        <p>
          Ask a question and the agent can <strong>run SQL against your live database</strong>, read
          the rows back, and analyze them - dropping a Result node on the canvas as it goes. Ask it
          to write a query instead and it places an <strong>un-run query node</strong> for you to
          execute yourself, so you stay in control of what actually touches the data.
        </p>
        <p>
          It does more than query. The agent can{" "}
          <strong>
            create pages, lay down query, variable, and text nodes, wire them together
          </strong>
          , and even <strong>pan, zoom, and frame</strong> the camera - so it can build out a whole
          working canvas, not just answer in a chat bubble.
        </p>
      </DocsSection>

      <DocsSection slug='context' title='Canvas-aware, on your terms' level={2}>
        <p>
          The agent automatically knows the <strong>schema</strong> of the active connection - table
          and column names, types, foreign keys, and primary keys - so it reasons about your data
          without guessing. It never invents tables that aren&apos;t there.
        </p>
        <p>
          Result rows are different: an agent only sees a result set when you{" "}
          <strong>explicitly wire a Result node into it</strong>. Until you draw that edge,
          sensitive row data stays off the conversation.
        </p>
      </DocsSection>

      <DocsSection slug='mcp' title='Or hand the wheel to your own agent' level={2}>
        <p>
          Prefer Claude Code, Codex, or another coding agent? Enable Peek&apos;s MCP server and let
          them drive the canvas directly - inspecting the schema and pages, creating and updating
          nodes, wiring them up, and moving the camera through the same building blocks the built-in
          agent uses.
        </p>
        <FeatureVideo src='/casts/mcp.webm' label='Play the agentic MCP demo' />
        <p>
          The MCP surface is deliberately narrower: external agents{" "}
          <strong>can&apos;t execute queries</strong>, and any embedded data rows are stripped
          before a page is handed over, so driving the canvas never leaks your results. It&apos;s
          off by default - enable it in settings, restart Peek, then register the server with your
          agent of choice.
        </p>
        <Code lang='bash' title='Claude Code'>
          {`claude mcp add --transport http peek http://127.0.0.1:13315/`}
        </Code>
      </DocsSection>
    </>
  );
}
