import type { Metadata } from "next";
import { SubpageLayout } from "@/components/SubpageLayout/SubpageLayout";
import { DocsNav } from "@/docs/DocsNav/DocsNav";
import { Nav } from "@/landing/Nav/Nav";
import { Starfield } from "@/landing/Starfield/Starfield";
import { getLatestRelease } from "@/release/latestRelease";

export const metadata: Metadata = {
  title: { default: "Peek - Docs", template: "%s - Peek Docs" },
  description:
    "Everything you need to install Peek, connect your first database, and tune workspaces, themes, AI, and multiplayer to your team.",
};

export default async function DocsRootLayout({ children }: { children: React.ReactNode }) {
  const release = await getLatestRelease();
  return (
    <>
      <Starfield />
      <Nav sticky currentPage='docs' downloadUrl={release.downloadUrl} />
      <main>
        <SubpageLayout eyebrow='Documentation' nav={<DocsNav />}>
          {children}
        </SubpageLayout>
      </main>
    </>
  );
}
