// Web stub of the desktop `queryInfo.ts` (which asks the Rust host to parse
// the SQL). Reporting "other, no tables" naturally disables every inline
// edit/duplicate/delete affordance in the Result node — a guest talks to the
// database only through host-proxied query execution.

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

export function useQueryInfo(_query: string): QueryInfo | null {
  return null;
}
