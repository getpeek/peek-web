"use client";

// Trimmed desktop MonacoManager: warms Monaco up before the first Query node
// mounts, registers the editor themes and the LSP completion provider — the
// language server runs on the desktop host, reached over the multiplayer doc.

import { useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { rosePineTheme } from "../../../../themes/rosePineTheme";
import { rosePineDawnTheme } from "../../../../themes/rosePineDawnTheme";
import { terminalTheme } from "../../../../themes/terminalTheme";
import { ensureLspProvider } from "./lspProvider";

export const MonacoManager = () => {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  return (
    <div
      style={{
        position: "absolute",
        left: -9999,
        top: -9999,
        width: 1,
        height: 1,
      }}
    >
      <Editor
        height='1px'
        width='1px'
        defaultLanguage='sql'
        defaultValue=''
        theme='vs-dark'
        onMount={(editor, monaco) => {
          monacoRef.current = monaco;
          editorRef.current = editor;

          monaco.editor.defineTheme("rose-pine", rosePineTheme);
          monaco.editor.defineTheme("rose-pine-dawn", rosePineDawnTheme);
          monaco.editor.defineTheme("terminal", terminalTheme);
          ensureLspProvider(monaco);
        }}
        options={{
          readOnly: false,
          minimap: { enabled: false },
          lineNumbers: "off",
          folding: false,
          scrollBeyondLastLine: false,
          renderLineHighlight: "all",
          selectionHighlight: true,
          contextmenu: false,
        }}
      />
    </div>
  );
};
