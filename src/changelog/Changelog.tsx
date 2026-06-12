import type { ReleaseNote } from "@/release/listReleases";
import { ReleaseEntry } from "./ReleaseEntry";
import styles from "./Changelog.module.css";
import Link from "next/link";

const allReleasesUrl = "https://github.com/getpeek/peek/releases";

export function Changelog({ notes }: { notes: ReleaseNote[] }) {
  return (
    <section className={styles.changelog}>
      <h1 className={styles.title}>Changelog</h1>
      <p className={styles.lede}>
        What's new in Peek. To see a full list of releases, see the{" "}
        <Link href={allReleasesUrl} target='_blank' rel='noreferrer'>
          GitHub releases
        </Link>{" "}
        page.
      </p>
      {notes.length === 0 ? (
        <p className={styles.empty}>
          Couldn't load release notes right now. Browse all releases on{" "}
          <a href={allReleasesUrl} target='_blank' rel='noreferrer'>
            GitHub
          </a>
          .
        </p>
      ) : (
        <ol className={styles.timeline}>
          {notes.map(note => (
            <ReleaseEntry key={note.version} note={note} />
          ))}
        </ol>
      )}
    </section>
  );
}
