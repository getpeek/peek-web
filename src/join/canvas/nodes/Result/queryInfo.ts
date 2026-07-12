// Web port of the desktop `queryInfo.ts`. Desktop asks the Rust host to parse
// the SQL (`get_query_info`); a browser guest has no host-side parser, so we
// derive what the Result node actually needs — the statement type and the set
// of source tables — from the query text against the host-synced schema.
//
// `statementType` + `tables[].name` power clickable PK/FK drill-down
// (`findReferences.ts`), which is the point of this port. But `getEditableTableName`
// (`cell/inlineEdit.ts`) reads the SAME `queryInfo` to decide whether a result is
// inline-editable, and a guest must NOT edit rows in place — its commit path
// (`useCommitEdit`) runs `invoke("execute_statement")`, which the web `tauri.ts`
// rejects. So every table is reported `isJoined: true`: `getEditableTableName`
// bails on any joined table, keeping inline edit / add-row / duplicate / delete
// disabled exactly as when this stub returned `null` — while `findReferences`,
// which ignores `isJoined`, still resolves references.

import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { schemaAtom } from "../../../state";

export type StatementType = "select" | "insert" | "update" | "delete" | "other";

export type TableRef = {
  name: string;
  alias: string | null;
  isJoined: boolean;
};

export type QueryInfo = {
  statementType: StatementType;
  tables: TableRef[];
};

function statementType(query: string): StatementType {
  // Skip leading whitespace and line/block comments before the first keyword.
  const head = query.replace(/^(\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)+/u, "").toLowerCase();
  if (/^(with|select)\b/u.test(head)) {
    return "select";
  }
  if (/^insert\b/u.test(head)) {
    return "insert";
  }
  if (/^update\b/u.test(head)) {
    return "update";
  }
  if (/^delete\b/u.test(head)) {
    return "delete";
  }
  return "other";
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

// Which known tables does the query mention? Matching against the schema's
// table universe (rather than parsing FROM/JOIN) keeps this robust without a
// real SQL parser: an over-matched table only yields drill-down links for
// columns that genuinely reference it, so false positives are inert.
function referencedTables(query: string, tableNames: string[]): TableRef[] {
  const lower = query.toLowerCase();
  return tableNames
    .filter(name => new RegExp(`\\b${escapeRegExp(name.toLowerCase())}\\b`, "u").test(lower))
    .map(name => ({ name, alias: null, isJoined: true }));
}

export function useQueryInfo(query: string): QueryInfo | null {
  const schema = useAtomValue(schemaAtom);
  // Memoized so the identity stays stable for `useColumnReferences`' dependency.
  return useMemo(() => {
    if (query.trim().length === 0) {
      return null;
    }
    return {
      statementType: statementType(query),
      tables: referencedTables(query, Object.keys(schema.tables)),
    };
  }, [query, schema.tables]);
}
