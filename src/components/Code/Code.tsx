import { Fragment } from "react";

import { type CodeLang, tokenizeLine } from "./highlight";
import styles from "./Code.module.css";

export type { CodeLang };

type CodeProps = {
  lang: CodeLang;
  // optional label shown in the window's title bar (e.g. "~/dev")
  title?: string;
  children: string;
};

export function Code({ lang, title, children }: CodeProps) {
  // strip the leading/trailing blank lines that JSX template literals pick up,
  // but leave inner indentation untouched
  const source = String(children).replace(/^\n+/u, "").replace(/\s+$/u, "");
  const lines = source.split("\n");

  return (
    <div className={styles.codeWindow}>
      <div className={styles.codeBar}>
        <span className={styles.lights}>
          <i />
          <i />
          <i />
        </span>
        {title ? <span className={styles.codeTitle}>{title}</span> : null}
      </div>
      <pre>
        {lines.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 ? "\n" : null}
            {tokenizeLine(line, lang).map((token, tokenIndex) => (
              <span key={tokenIndex} className={styles[token.kind]}>
                {token.value}
              </span>
            ))}
          </Fragment>
        ))}
      </pre>
    </div>
  );
}
