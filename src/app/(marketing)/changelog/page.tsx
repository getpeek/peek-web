import type { Metadata } from "next";
import { Changelog } from "@/changelog/Changelog";
import { Nav } from "@/landing/Nav/Nav";
import { Starfield } from "@/landing/Starfield/Starfield";
import { getLatestRelease } from "@/release/latestRelease";
import { listReleases } from "@/release/listReleases";

export const metadata: Metadata = {
  title: "Peek - Changelog",
  description:
    "Release notes for every Peek build - what's new, fixed, and improved in each version.",
};

export default async function ChangelogPage() {
  const [release, notes] = await Promise.all([getLatestRelease(), listReleases()]);
  return (
    <>
      <Starfield />
      <Nav sticky currentPage='changelog' downloadUrl={release.downloadUrl} />
      <main>
        <Changelog notes={notes} />
      </main>
    </>
  );
}
