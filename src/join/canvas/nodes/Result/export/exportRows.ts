// Web port: the desktop version uses the Tauri save dialog + fs plugin; the
// browser equivalent is a Blob download.

import { serializeRows, type ExportFormat } from "./serializeRows";
import type { DatabaseResult } from "../../../../state";

const FORMAT_MIME: Record<ExportFormat, string> = {
  csv: "text/csv",
  json: "application/json",
  sql: "application/sql",
};

export function exportRows(
  rows: DatabaseResult,
  format: ExportFormat,
  defaultName: string,
  tableName?: string,
): void {
  if (rows.length === 0) {
    return;
  }
  const blob = new Blob([serializeRows(rows, format, tableName)], { type: FORMAT_MIME[format] });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${defaultName}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
