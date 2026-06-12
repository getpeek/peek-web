import type { ReleaseNote } from "@/release/listReleases";
import { releaseBodyHtml } from "./releaseBodyHtml";
import styles from "./ReleaseEntry.module.css";

// Fixed locale — dates render at build/revalidate time, so the server's locale
// must not leak into the page.
const publishedDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export function ReleaseEntry({ note }: { note: ReleaseNote }) {
  return (
    <li className={styles.entry}>
      <header className={styles.head}>
        <a className={styles.version} href={note.htmlUrl} target='_blank' rel='noreferrer'>
          v{note.version}
        </a>
        <time className={styles.date} dateTime={note.publishedAt}>
          {publishedDate.format(new Date(note.publishedAt))}
        </time>
      </header>
      {note.body.trim().length > 0 && (
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: releaseBodyHtml(note.body) }}
        />
      )}
    </li>
  );
}
