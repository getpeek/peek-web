import type { Metadata } from "next";
import { SubpageLayout } from "@/components/SubpageLayout/SubpageLayout";
import { FeaturesNav } from "@/features/FeaturesNav/FeaturesNav";
import { Nav } from "@/landing/Nav/Nav";
import { Starfield } from "@/landing/Starfield/Starfield";
import { getLatestRelease } from "@/release/latestRelease";

export const metadata: Metadata = {
  title: { default: "Peek - Features", template: "%s - Peek Features" },
  description:
    "A tour of everything Peek puts on the canvas - the command palette, multiplayer, AI agents, inline editing, import/export, variables, and themes.",
};

export default async function FeaturesRootLayout({ children }: { children: React.ReactNode }) {
  const release = await getLatestRelease();
  return (
    <>
      <Starfield />
      <Nav sticky currentPage='features' downloadUrl={release.downloadUrl} />
      <main>
        <SubpageLayout eyebrow='Features' nav={<FeaturesNav />}>
          {children}
        </SubpageLayout>
      </main>
    </>
  );
}
