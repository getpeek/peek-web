// Minimal per-line tokenizers for the <Code> window. The code shown on the
// site is our own trusted content, so these only need to cover the handful of
// token kinds we render - not a full grammar. Mirrors the demo canvas's
// tokenizeSqlLine in spirit.

export type CodeLang = "json" | "bash";

export type TokenKind =
  | "kw"
  | "str"
  | "num"
  | "key"
  | "punct"
  | "cmd"
  | "flag"
  | "url"
  | "prompt"
  | "comment"
  | "plain";

export type Token = {
  value: string;
  kind: TokenKind;
};

export function tokenizeLine(line: string, lang: CodeLang): Token[] {
  return lang === "json" ? tokenizeJsonLine(line) : tokenizeBashLine(line);
}

// A JSON string preceding a colon is an object key; otherwise a value. Keys
// therefore come first in the alternation so the lookahead wins greedily.
const JSON_PATTERN =
  /("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]:,])/gu;

function tokenizeJsonLine(line: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;

  for (const match of line.matchAll(JSON_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) {
      tokens.push({ value: line.slice(last, index), kind: "plain" });
    }
    const [full, key, str, kw, num, punct] = match;
    const kind: TokenKind = key
      ? "key"
      : str
        ? "str"
        : kw
          ? "kw"
          : num
            ? "num"
            : punct
              ? "punct"
              : "plain";
    tokens.push({ value: full, kind });
    last = index + full.length;
  }

  if (last < line.length) {
    tokens.push({ value: line.slice(last), kind: "plain" });
  }
  return tokens;
}

// Bash is position-sensitive (the first word is the command), which a single
// regex can't express cleanly, so we scan token-by-token instead.
const BASH_TOKEN =
  /(#.*$)|('[^']*'|"[^"]*")|((?:https?:\/\/|git@|ssh:\/\/)\S+)|(--?[A-Za-z][\w-]*)|(\s+)|(\S+)/gu;

function tokenizeBashLine(line: string): Token[] {
  const indent = line.match(/^\s*/u)?.[0] ?? "";
  const body = line.slice(indent.length);

  if (body.startsWith("#")) {
    return [{ value: line, kind: "comment" }];
  }

  const tokens: Token[] = [];
  if (indent) {
    tokens.push({ value: indent, kind: "plain" });
  }

  let rest = body;
  // A leading "$ " is the shell prompt, not part of the command.
  const prompt = rest.match(/^\$\s+/u);
  if (prompt) {
    tokens.push({ value: prompt[0], kind: "prompt" });
    rest = rest.slice(prompt[0].length);
  }

  let expectCommand = true;
  for (const match of rest.matchAll(BASH_TOKEN)) {
    const [full, comment, str, url, flag, space, word] = match;
    if (comment) {
      tokens.push({ value: full, kind: "comment" });
      continue;
    }
    if (str) {
      tokens.push({ value: full, kind: "str" });
      continue;
    }
    if (url) {
      tokens.push({ value: full, kind: "url" });
      continue;
    }
    if (flag) {
      tokens.push({ value: full, kind: "flag" });
      continue;
    }
    if (space) {
      tokens.push({ value: full, kind: "plain" });
      continue;
    }
    // a bare word: the first one on the line is the command, the rest are args
    tokens.push({ value: word, kind: expectCommand ? "cmd" : "plain" });
    expectCommand = false;
  }

  return tokens;
}
