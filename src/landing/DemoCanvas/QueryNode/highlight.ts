// Minimal SQL tokenizer for the demo query node. The SQL is our own trusted
// constant, so this only needs to cover the handful of token kinds we render.

export type SqlTokenKind = "kw" | "fn" | "num" | "str" | "plain";

export type SqlToken = {
  value: string;
  kind: SqlTokenKind;
};

// Longer multi-word keywords come first so the alternation matches them greedily.
const PATTERN =
  /(\b(?:GROUP BY|ORDER BY|LEFT JOIN|INNER JOIN|SELECT|FROM|WHERE|LIMIT|JOIN|ON|AND|OR|AS|DESC|ASC)\b)|(\b(?:COUNT|SUM|AVG|MAX|MIN)\b)|('[^']*')|(\b\d+\b)/g;

export function tokenizeSqlLine(line: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let last = 0;

  for (const match of line.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) {
      tokens.push({ value: line.slice(last, index), kind: "plain" });
    }
    const [full, keyword, fn, str] = match;
    const kind: SqlTokenKind = keyword
      ? "kw"
      : fn
        ? "fn"
        : str
          ? "str"
          : "num";
    tokens.push({ value: full, kind });
    last = index + full.length;
  }

  if (last < line.length) {
    tokens.push({ value: line.slice(last), kind: "plain" });
  }
  return tokens;
}
