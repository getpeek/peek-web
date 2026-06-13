import type { SubpageNavItem } from "@/components/SubpageNav/SubpageNav";

export const navTree: SubpageNavItem[] = [
  { label: "Installation", slug: "installation" },
  { label: "Getting started", slug: "getting-started" },
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
