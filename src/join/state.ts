// Web stand-in for the desktop `src/state.ts`. Exports the same names the
// copied canvas files import, backed by static guest values instead of the
// Tauri-loaded config — the omitted keymap bindings are what gates desktop
// features (palette, page search, camera lock, …) off the web build.

import { atom } from "jotai";

export type DatabaseResult = [string, unknown, string][][];

export type Theme = "pine" | "midnight" | "midday" | "terminal";

export interface Config {
  name: string;
  theme: Theme;
  keymap: Record<string, string>;
  canvas: {
    enable_regions: boolean;
  };
}

// Desktop `default_keymap()` (src-tauri/src/config/keymap.rs) minus bindings
// for features the guest client doesn't ship: App::Quit, CommandPalette,
// ConnectionPicker, Help::Keymap, Page::New/Close/Search/GoToNode and
// View::ToggleCameraLock.
const WEB_DEFAULT_KEYMAP: Record<string, string> = {
  escape: "Tool::Select",
  l: "Tool::LassoSelect",
  q: "Tool::Query",
  a: "Tool::Agent",
  t: "Tool::Text",
  v: "Tool::Variable",
  d: "Tool::Draw",
  "meta-x": "Edit::Cut",
  "meta-c": "Edit::Copy",
  "meta-v": "Edit::Paste",
  "meta-a": "Edit::SelectAll",
  backspace: "Edit::DeleteSelection",
  "meta-z": "History::Undo",
  "shift-meta-z": "History::Redo",
  "meta-0": "Zoom::Reset",
  "meta-shift-0": "Zoom::FitView",
  "meta-shift-[": "Page::Previous",
  "meta-shift-]": "Page::Next",
  "meta-[": "Page::SelectPreviousQuery",
  "meta-]": "Page::SelectNextQuery",
  "meta-arrowleft": "Page::SelectNodeLeft",
  "meta-arrowright": "Page::SelectNodeRight",
  "meta-arrowup": "Page::SelectNodeUp",
  "meta-arrowdown": "Page::SelectNodeDown",
  "meta-.": "View::ToggleUi",
  "shift-p": "Result::Pivot",
  "meta-g": "Region::GroupSelection",
  "meta-shift-g": "Region::UngroupSelection",
  r: "Region::OpenPicker",
};

export const configAtom = atom<Config>({
  name: "Guest",
  theme: "midnight",
  keymap: WEB_DEFAULT_KEYMAP,
  canvas: { enable_regions: true },
});

export const effectiveThemeAtom = atom<Theme>(() => "midnight");

export interface Schema {
  tables: Record<string, [string, string][]>;
  references: Record<string, string[]>;
  primaryKeys: Record<string, string[]>;
}

export const emptySchema = (): Schema => ({
  tables: {},
  references: {},
  primaryKeys: {},
});

export const schemaAtom = atom<Schema>(emptySchema());

export const commandPaletteOpenAtom = atom<boolean>(false);

export const pageSearchOpenAtom = atom<boolean>(false);

export const keymapHelpOpenAtom = atom<boolean>(false);

export const uiVisibilityAtom = atom<boolean>(true);
