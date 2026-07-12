import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import "./editor.css";
import { useEffect, useRef } from "react";
import { useStore } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { scanVariableSites, type VariableValue } from "../../../variables";
import { getOverflowWidgetsDomNode, syncOverflowWidgetsScale } from "./overflowWidgets";
import {
  ensureVariableProvider,
  variableHoverMessage,
  variablesByModelUri,
} from "./variableProvider";
import { attachLspDocumentSync, ensureLspProvider } from "./lspProvider";
import { effectiveThemeAtom } from "../../../../state";
import { editorThemeForUiTheme } from "../../../../themes/editorTheme";

export const SqlEditor = ({
  query,
  variables,
  onQueryChange,
  onMount,
}: {
  query: string;
  variables?: Record<string, VariableValue>;
  onQueryChange: (query: string) => void;
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}) => {
  const ref = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const applyingExternalRef = useRef(false);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const variablesRef = useRef<Record<string, VariableValue>>(variables ?? {});
  const zoom = useStore(s => s.transform[2]);
  const zoomRef = useRef(zoom);
  const theme = editorThemeForUiTheme(useAtomValue(effectiveThemeAtom));

  useEffect(() => {
    zoomRef.current = zoom;
    const ed = editorRef.current;
    if (ed) {
      syncOverflowWidgetsScale(ed, zoom);
    }
  }, [zoom]);

  useEffect(() => {
    variablesRef.current = variables ?? {};
    const ed = editorRef.current;
    const model = ed?.getModel();
    if (model) {
      variablesByModelUri.set(model.uri.toString(), Object.keys(variables ?? {}));
    }
    redrawDecorations();
  }, [variables]);

  const redrawDecorations = () => {
    const ed = editorRef.current;
    if (!ed) {
      return;
    }
    const model = ed.getModel();
    if (!model) {
      return;
    }

    const text = model.getValue();
    const sites = scanVariableSites(text);
    const known = variablesRef.current;

    const decorations: editor.IModelDeltaDecoration[] = sites.map(site => {
      const startPos = model.getPositionAt(site.start);
      const endPos = model.getPositionAt(site.end);
      const isMissing = !Object.prototype.hasOwnProperty.call(known, site.name);
      return {
        range: {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        },
        options: {
          inlineClassName: isMissing ? "sql-var-chip-missing" : "sql-var-chip",
          hoverMessage: isMissing
            ? { value: `\`@${site.name}\` is not defined by any connected Variable node` }
            : { value: variableHoverMessage(known[site.name]) },
        },
      };
    });

    if (decorationsRef.current) {
      decorationsRef.current.set(decorations);
    } else {
      decorationsRef.current = ed.createDecorationsCollection(decorations);
    }
  };

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    ref.current.editor.setTheme(theme);
  }, [theme, ref.current]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) {
      return;
    }
    // While the local user is typing, the editor — not the `query` prop — is the
    // source of truth. In a multiplayer session inbound doc-updates for this node
    // keep streaming in as the user types (the host re-emits the node), and
    // reconciling them here would `setValue` the model back to a value that lags
    // the keystroke, dropping the character just typed (a lone space is the most
    // visible case). Reconcile only when the editor isn't focused; local edits
    // already flow out through `onChange`.
    if (ed.hasTextFocus()) {
      return;
    }
    if (ed.getValue() !== query) {
      // `setValue` fires Monaco's content-change event synchronously, which
      // `@monaco-editor/react` surfaces through `onChange`. Suppress that so a
      // programmatic reconcile isn't re-emitted as a user edit (which, echoed
      // back, would ping-pong until React throws "Maximum update depth
      // exceeded").
      applyingExternalRef.current = true;
      try {
        ed.setValue(query);
      } finally {
        applyingExternalRef.current = false;
      }
    }
  }, [query]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <div className='query-window' style={{ height: "100%", width: "100%" }}>
        <Editor
          height='100%'
          defaultLanguage='sql'
          defaultValue={query}
          theme={theme}
          onMount={(editor, monaco) => {
            ref.current = monaco;
            editorRef.current = editor;
            monaco.editor.setTheme(theme);
            ensureVariableProvider(monaco);
            ensureLspProvider(monaco);
            const lspSubs = attachLspDocumentSync(monaco, editor);
            const model = editor.getModel();
            if (model) {
              variablesByModelUri.set(model.uri.toString(), Object.keys(variablesRef.current));
            }
            const contentSub = editor.onDidChangeModelContent(() => {
              redrawDecorations();
            });
            // Widgets (hover/suggest) only ever show for the focused or
            // hovered editor; re-anchor the shared overflow node to it before
            // they appear so they land on the right anchor at any zoom.
            const syncScale = () => syncOverflowWidgetsScale(editor, zoomRef.current);
            const focusSub = editor.onDidFocusEditorWidget(syncScale);
            const editorDom = editor.getDomNode();
            editorDom?.addEventListener("mouseenter", syncScale);
            const disposeSub = editor.onDidDispose(() => {
              contentSub.dispose();
              focusSub.dispose();
              for (const sub of lspSubs) {
                sub.dispose();
              }
              editorDom?.removeEventListener("mouseenter", syncScale);
              if (model) {
                variablesByModelUri.delete(model.uri.toString());
              }
              disposeSub.dispose();
            });
            redrawDecorations();
            onMount?.(editor, monaco);
          }}
          options={{
            lineNumbers: "off",
            wordWrap: "on",
            cursorStyle: "line",
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            scrollBeyondLastLine: false,
            glyphMargin: false,
            guides: {
              indentation: false,
            },
            renderLineHighlight: "none",
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            autoClosingBrackets: "always",
            autoClosingOvertype: "always",
            autoClosingQuotes: "always",
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              useShadows: false,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              insertMode: "replace",
            },
            fixedOverflowWidgets: true,
            overflowWidgetsDomNode: getOverflowWidgetsDomNode(),
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: "on",
            accessibilitySupport: "off",
            // In Chromium Monaco's EditContext focus target is a plain <div>,
            // which xyflow's window-level Space/Backspace handlers don't
            // recognize as an input — they preventDefault keystrokes meant for
            // the editor. Use the hidden textarea, like desktop's WKWebView.
            editContext: false,
            automaticLayout: true,
            fontSize: 14,
            fontFamily: "Monaspace Krypton, SF Mono, Monaco, Inconsolata, Roboto Mono, monospace",
            lineHeight: 1.6,
            letterSpacing: 0.5,
            smoothScrolling: true,
            cursorBlinking: "solid",
            cursorSmoothCaretAnimation: "off",
            smartSelect: {
              selectSubwords: true,
              selectLeadingAndTrailingWhitespace: false,
            },
            mouseWheelZoom: false,
            dragAndDrop: true,
            multiCursorModifier: "ctrlCmd",
            selectOnLineNumbers: false,
            contextmenu: true,
            columnSelection: false,
            selectionHighlight: true,
            occurrencesHighlight: "singleFile",
            readOnly: false,
            renderControlCharacters: false,
            renderWhitespace: "none",
            copyWithSyntaxHighlighting: true,
          }}
          onChange={value => {
            if (applyingExternalRef.current) {
              return;
            }
            onQueryChange(value ?? "");
          }}
        />
      </div>
    </div>
  );
};
