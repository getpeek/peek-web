export type KeybindingRow = {
  action: string;
  keys: string[];
};

export type KeybindingCategory = {
  category: string;
  rows: KeybindingRow[];
};

export const keybindingCategories: KeybindingCategory[] = [
  {
    category: "App",
    rows: [
      { action: "Command palette", keys: ["⌘", "P"] },
      { action: "Workspace picker", keys: ["P"] },
      { action: "Deselect node", keys: ["esc"] },
      { action: "Delete node", keys: ["backspace"] },
      { action: "New page", keys: ["⌘", "T"] },
      { action: "Close page", keys: ["⌘", "W"] },
      { action: "Next page", keys: ["⌘", "⇧", "]"] },
      { action: "Previous page", keys: ["⌘", "⇧", "["] },
    ],
  },
  {
    category: "Tools",
    rows: [
      { action: "Select tool", keys: ["esc"] },
      { action: "Lasso tool", keys: ["L"] },
      { action: "Query", keys: ["Q"] },
      { action: "Agent", keys: ["A"] },
      { action: "Variable", keys: ["V"] },
      { action: "Text", keys: ["T"] },
      { action: "Draw", keys: ["D"] },
    ],
  },
  {
    category: "Navigation",
    rows: [
      { action: "Previous query node", keys: ["⌘", "["] },
      { action: "Next query node", keys: ["⌘", "]"] },
      { action: "Node up", keys: ["⌘", "↑"] },
      { action: "Node down", keys: ["⌘", "↓"] },
      { action: "Node left", keys: ["⌘", "←"] },
      { action: "Node right", keys: ["⌘", "→"] },
      { action: "Reset zoom", keys: ["⌘", "0"] },
      { action: "Fit canvas", keys: ["⌘", "⇧", "0"] },
    ],
  },
];
