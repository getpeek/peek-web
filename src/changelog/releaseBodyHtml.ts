import { Marked } from "marked";

const SAFE_HREF = /^(?:https?:|mailto:|#|\/)/iu;

const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/*
 * Auto-generated release notes embed contributor-written PR titles verbatim,
 * so raw HTML is escaped and non-web link protocols are neutralized - the same
 * posture as GitHub's own release rendering. `breaks` matches GitHub too:
 * release bodies treat a single newline as a line break.
 */
const marked = new Marked({
  breaks: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link(token) {
      return SAFE_HREF.test(token.href) ? false : escapeHtml(token.text);
    },
  },
});

export const releaseBodyHtml = (body: string): string => marked.parse(body, { async: false });
