import type { SubpageNavItem } from "@/components/SubpageNav/SubpageNav";
import { SubpageNav } from "@/components/SubpageNav/SubpageNav";

const navTree: SubpageNavItem[] = [
  { label: "Command Palette", slug: "command-palette" },
  { label: "Multiplayer", slug: "multiplayer" },
  { label: "AI Agents", slug: "ai-agents" },
  { label: "Editing Data", slug: "editing-data" },
  { label: "Import / Export", slug: "import-export" },
  { label: "Themes", slug: "themes" },
  {
    label: "Nodes",
    slug: "nodes",
    children: [
      { label: "Query", slug: "query" },
      { label: "Result", slug: "result" },
      { label: "Agent", slug: "agent" },
      { label: "Chart", slug: "chart" },
      { label: "Variable", slug: "variable" },
      { label: "Text", slug: "text" },
      { label: "Draw", slug: "draw" },
    ],
  },
];

export function FeaturesNav() {
  return <SubpageNav tree={navTree} root='/features' ariaLabel='Features' />;
}
