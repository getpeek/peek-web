import type { Monaco } from "@monaco-editor/react";
import type { languages } from "monaco-editor";
import type { VariableValue } from "../../../variables";

export const variablesByModelUri = new Map<string, string[]>();
let variableProviderRegistered = false;

export function variableHoverMessage(value: VariableValue): string {
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 1) {
    return `\`${values[0].replaceAll("`", "\\`")}\``;
  }
  return `${values.length} values`;
}

export function ensureVariableProvider(monaco: Monaco) {
  if (variableProviderRegistered) {
    return;
  }
  variableProviderRegistered = true;
  const provider: languages.CompletionItemProvider = {
    triggerCharacters: ["@"],
    provideCompletionItems(model, position) {
      const uri = model.uri.toString();
      const variables = variablesByModelUri.get(uri) ?? [];
      if (variables.length === 0) {
        return { suggestions: [] };
      }

      const lineText = model.getLineContent(position.lineNumber);
      const before = lineText.slice(0, position.column - 1);
      const match = before.match(/@(\w*)$/u);
      if (!match) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - match[1].length,
        endColumn: word.endColumn,
      };

      return {
        suggestions: variables.map(v => ({
          label: `@${v}`,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: v,
          range,
          detail: "variable",
          sortText: `0_${v}`,
        })),
      };
    },
  };
  monaco.languages.registerCompletionItemProvider("sql", provider);
}
