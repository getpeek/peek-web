// Web port of the desktop LSP provider. Completions and diagnostics are
// computed by the desktop host's language server and round-trip over the
// multiplayer doc (see multiplayer/lspProxy.ts) instead of a local Tauri
// invoke — the latency shows up as suggest-widget delay, nothing more.

import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable, languages } from "monaco-editor";
import { getDefaultStore } from "jotai";
import { guestSessionAtom } from "../../../../multiplayer/state";
import { requestCompletion, requestDiagnostics } from "../../../../multiplayer/lspProxy";
import { type LspDiagnostic, LspDiagnosticSeverity } from "./lspTypes";
import { isSnippet, lspKindToMonaco } from "./lspBridge";

const MARKER_OWNER = "peek-sql";
// Desktop syncs at 30ms; every web sync is a network round-trip, so batch
// keystrokes harder before asking the host for diagnostics.
const DIAGNOSTICS_DEBOUNCE_MS = 300;

let lspProviderRegistered = false;

// The request key needs a stable per-editor segment; the trailing counter of
// Monaco's inmemory://model/N uri is exactly that.
function modelIdOf(model: editor.ITextModel): string {
  return model.uri.toString().split("/").pop() ?? "0";
}

function lspSeverityToMonaco(monaco: Monaco, severity: number | undefined) {
  switch (severity) {
    case LspDiagnosticSeverity.Error:
      return monaco.MarkerSeverity.Error;
    case LspDiagnosticSeverity.Warning:
      return monaco.MarkerSeverity.Warning;
    case LspDiagnosticSeverity.Information:
      return monaco.MarkerSeverity.Info;
    case LspDiagnosticSeverity.Hint:
      return monaco.MarkerSeverity.Hint;
    default:
      return monaco.MarkerSeverity.Error;
  }
}

function applyDiagnostics(monaco: Monaco, model: editor.ITextModel, diagnostics: LspDiagnostic[]) {
  const markers: editor.IMarkerData[] = diagnostics.map(d => ({
    severity: lspSeverityToMonaco(monaco, d.severity),
    message: d.message,
    source: d.source,
    startLineNumber: d.range.start.line + 1,
    startColumn: d.range.start.character + 1,
    endLineNumber: d.range.end.line + 1,
    endColumn: d.range.end.character + 1,
  }));
  monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
}

export function ensureLspProvider(monaco: Monaco): void {
  if (lspProviderRegistered) {
    return;
  }
  lspProviderRegistered = true;
  const provider: languages.CompletionItemProvider = {
    triggerCharacters: [" ", ".", ",", "\n", "\t"],
    async provideCompletionItems(model, position, _ctx, token) {
      const session = getDefaultStore().get(guestSessionAtom);
      if (!session) {
        return { suggestions: [], incomplete: true };
      }

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const items = await requestCompletion(session, {
        modelId: modelIdOf(model),
        text: model.getValue(),
        line: position.lineNumber - 1,
        character: position.column - 1,
      });
      if (token.isCancellationRequested) {
        return { suggestions: [], incomplete: true };
      }

      const suggestions = items.map<languages.CompletionItem>(item => {
        const insertText = item.insertText ?? item.label;
        const monacoItem: languages.CompletionItem = {
          label: item.label,
          kind: lspKindToMonaco(monaco, item.kind),
          insertText,
          range,
          detail: item.detail,
          documentation: item.documentation,
          sortText: item.sortText,
        };
        if (isSnippet(item.insertTextFormat)) {
          monacoItem.insertTextRules =
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
        }
        return monacoItem;
      });

      // incomplete:true so Monaco re-queries on every keystroke instead of
      // filtering a cached list — the cursor context can change with every
      // character (alias.| → column.| → expression).
      return { suggestions, incomplete: true };
    },
  };
  monaco.languages.registerCompletionItemProvider("sql", provider);
}

/**
 * Keep the host's LSP document cache in sync with this editor and surface the
 * returned diagnostics as model markers. Returns disposables to wire into the
 * editor's onDidDispose.
 */
export function attachLspDocumentSync(
  monaco: Monaco,
  ed: editor.IStandaloneCodeEditor,
): IDisposable[] {
  const subscriptions: IDisposable[] = [];
  const model = ed.getModel();
  if (!model) {
    return subscriptions;
  }

  const modelId = modelIdOf(model);

  const sync = (text: string) => {
    const session = getDefaultStore().get(guestSessionAtom);
    if (!session) {
      return;
    }
    void requestDiagnostics(session, { modelId, text }).then(diagnostics => {
      // null means timed out or superseded — a fresher sync owns the markers.
      if (diagnostics === null || model.isDisposed()) {
        return;
      }
      applyDiagnostics(monaco, model, diagnostics);
    });
  };

  sync(model.getValue());

  let pending: number | null = null;
  const sub = ed.onDidChangeModelContent(() => {
    if (pending !== null) {
      window.clearTimeout(pending);
    }
    pending = window.setTimeout(() => {
      pending = null;
      sync(model.getValue());
    }, DIAGNOSTICS_DEBOUNCE_MS);
  });
  subscriptions.push(sub, {
    dispose: () => {
      if (pending !== null) {
        window.clearTimeout(pending);
      }
      if (!model.isDisposed()) {
        monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
      }
    },
  });
  return subscriptions;
}
