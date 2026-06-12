export type DocsNavItem = {
  label: string;
  slug: string;
  children?: DocsNavItem[];
};

export const navTree: DocsNavItem[] = [
  { label: "Installation", slug: "installation" },
  { label: "Getting started", slug: "getting-started" },
  {
    label: "Nodes",
    slug: "nodes",
    children: [
      { label: "Query", slug: "query" },
      { label: "Result", slug: "result" },
      { label: "Agent", slug: "agent-node" },
      { label: "Chart", slug: "chart" },
      { label: "Variable", slug: "variable" },
      { label: "Text", slug: "text" },
      { label: "Draw", slug: "draw" },
    ],
  },
  {
    label: "Configuration",
    slug: "configuration",
    children: [
      {
        label: "Workspaces",
        slug: "workspaces",
      },
      { label: "Themes", slug: "themes" },
      {
        label: "AI",
        slug: "ai",
        children: [
          { label: "Agent", slug: "agent" },
          { label: "MCP", slug: "mcp" },
        ],
      },
      { label: "Multiplayer", slug: "multiplayer" },
    ],
  },
  { label: "Keybindings", slug: "keybindings" },
];
