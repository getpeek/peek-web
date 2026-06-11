import type { Metadata } from "next";
import { Code } from "@/components/Code/Code";
import { DocsSection } from "@/docs/DocsContent/DocsSection";
import { Kbd } from "@/docs/Kbd/Kbd";
import styles from "@/docs/DocsContent/DocsContent.module.css";

export const metadata: Metadata = { title: "Configuration" };

export default function ConfigurationPage() {
  return (
    <>
      <h1 className={styles.title}>Configuration</h1>
      <p className={styles.lede}>
        This page contains the basic configuration options in Peek. All these settings are tweakable
        in both a <em>settings.json</em> as well as in the UI.
      </p>

      <DocsSection slug='workspaces' title='Workspaces &amp; Connections' level={2}>
        <p>
          A workspace is just a group of connections, representing either different projects or
          environments. You could either set up a workspace for <em>My weather app</em> and{" "}
          <em>My Todo App</em>, or one workspace for <em>Production</em> and one for{" "}
          <em>Staging</em>.
        </p>

        <p>Inside each workspace is a list of connections.</p>
        <p>
          Workspaces are serialized and stored as json at <em>~/peek/{`{workspace}`}</em>, so you
          can back them up via version control.
        </p>

        <p>
          You can manage your workspaces via the workspace picker in the UI, or you can edit your
          settings file directly.
        </p>

        <Code lang='json' title='~/peek/settings.json'>
          {`{
  "workspaces": [
    {
      "name": "My weather app",
      "connections": [
        {
          "name": "local",
          "color": "hsl(280deg, 50%, 50%)",
          "url": "postgres://dbuser:dbpass@localhost:5432/dbname",
          "ssh": {
            "host": "123.45.67.01",
            "port": 22,
            "local_port": 54321,
            "username": "user",
            "password": "password"
          }
        }
      ]
    }
  ]
}`}
        </Code>
      </DocsSection>

      <DocsSection slug='themes' title='Themes' level={2}>
        <p>
          Peek comes with three themes, two dark themes <em>Pine</em> and <em>Midnight</em>, and a
          light theme <em>Midday</em>. You can set your theme by using the command palette{" "}
          <Kbd>meta + p</Kbd> and typing <em>theme</em>.
        </p>
        <p>
          You can also set the theme in your <em>~/peek/settings.json</em> by updating the{" "}
          <em>theme</em> key.
        </p>
        <Code lang='json' title='~/peek/settings.json'>
          {`{
  "theme": "Pine"
}`}
        </Code>
      </DocsSection>

      <DocsSection slug='ai' title='AI' level={2}>
        <p>
          There are two main ways to interact with the AI features in Peek. The first is the built
          in AI agent and the second is using your own agent via MCP.
        </p>
        <p>
          Both methods use the same underlying functions and have the same capabilities. They are
          also not exposed to the query results, so you can't accidentally leak information.
        </p>
        <DocsSection slug='agent' title='Agent' level={3}>
          <p>
            Bring your own model use the built in Peek agent. Peek currently requires you to run
            your own OpenAI compatible server via Ollama, llama.cpp, lmstudio or similar. Once you
            have that running you can just need to specify which model and endpoint to use in your
            settings.
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

        <DocsSection slug='mcp' title='MCP' level={3}>
          <p>
            You can connect a coding agent, like Claude Code, Codex or Antigravity via Peek's MCP
            and have them create or update nodes, move the camera or analyze results. This is
            particularly useful for automating repetitive tasks, or inspect the database as you are
            collaborating with an agent.
          </p>

          <Code lang='bash' title='Claude Code'>
            {`claude mcp add --transport http peek http://localhost:13315`}
          </Code>
          <br />
          <Code lang='bash' title='Codex'>
            {`codex mcp add peek --url http://localhost:13315`}
          </Code>
          <br />
          <Code lang='bash' title='~/.gemini/config/mcp_config.json'>
            {`{
  "mcpServers": {
    "peek": {
      "serverUrl": "http://localhost:13315"
    }
  }
}`}
          </Code>
        </DocsSection>
      </DocsSection>

      <DocsSection slug='multiplayer' title='Multiplayer' level={2}>
        <p>
          You can invite a collaborator to join your session in Peek. You do this by sending them a
          ticket that includes all the dialing address to your computer.
        </p>

        <p>
          There is no centralized routing or message passing from Peek itself, so all data is P2P
          between the session collaborators. This is to ensure that it's fully safe to query results
          and look at data (with trusted collaborators) without worrying if Peek would leak any
          sensitive information.
        </p>

        <p>
          Invited guests also aren't given any connection info to your database, the connection
          stays opaque and the only thing they see is the connection name. When they execute a query
          it's done from your connection, and they are fed the results.
        </p>
      </DocsSection>
    </>
  );
}
