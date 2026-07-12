// Port of the desktop `lspBridge.ts`. The kind map is built lazily from the
// live Monaco instance — value-importing monaco-editor would pull the editor
// core into the Next bundle, so this module (like the rest of peek-web) only
// ever `import type`s it.

import type { Monaco } from "@monaco-editor/react";
import type { languages } from "monaco-editor";
import {
  LspCompletionItemKind,
  type LspCompletionItemKindValue,
  LspInsertTextFormat,
} from "./lspTypes";

let kindMap: Map<number, languages.CompletionItemKind> | null = null;

function ensureKindMap(monaco: Monaco): Map<number, languages.CompletionItemKind> {
  if (kindMap) {
    return kindMap;
  }
  const kinds = monaco.languages.CompletionItemKind;
  kindMap = new Map([
    [LspCompletionItemKind.Text, kinds.Text],
    [LspCompletionItemKind.Method, kinds.Method],
    [LspCompletionItemKind.Function, kinds.Function],
    [LspCompletionItemKind.Constructor, kinds.Constructor],
    [LspCompletionItemKind.Field, kinds.Field],
    [LspCompletionItemKind.Variable, kinds.Variable],
    [LspCompletionItemKind.Class, kinds.Class],
    [LspCompletionItemKind.Interface, kinds.Interface],
    [LspCompletionItemKind.Module, kinds.Module],
    [LspCompletionItemKind.Property, kinds.Property],
    [LspCompletionItemKind.Unit, kinds.Unit],
    [LspCompletionItemKind.Value, kinds.Value],
    [LspCompletionItemKind.Enum, kinds.Enum],
    [LspCompletionItemKind.Keyword, kinds.Keyword],
    [LspCompletionItemKind.Snippet, kinds.Snippet],
    [LspCompletionItemKind.Color, kinds.Color],
    [LspCompletionItemKind.File, kinds.File],
    [LspCompletionItemKind.Reference, kinds.Reference],
    [LspCompletionItemKind.Folder, kinds.Folder],
    [LspCompletionItemKind.EnumMember, kinds.EnumMember],
    [LspCompletionItemKind.Constant, kinds.Constant],
    [LspCompletionItemKind.Struct, kinds.Struct],
    [LspCompletionItemKind.Event, kinds.Event],
    [LspCompletionItemKind.Operator, kinds.Operator],
    [LspCompletionItemKind.TypeParameter, kinds.TypeParameter],
  ]);
  return kindMap;
}

export function lspKindToMonaco(
  monaco: Monaco,
  kind: LspCompletionItemKindValue | undefined,
): languages.CompletionItemKind {
  if (kind === undefined) {
    return monaco.languages.CompletionItemKind.Text;
  }
  return ensureKindMap(monaco).get(kind) ?? monaco.languages.CompletionItemKind.Text;
}

export function isSnippet(format: number | undefined): boolean {
  return format === LspInsertTextFormat.Snippet;
}
