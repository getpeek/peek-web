import { Closing } from "@/landing/Closing/Closing";
import { DemoCanvas } from "@/landing/DemoCanvas/DemoCanvas";
import { Feature } from "@/landing/Feature/Feature";
import { Hero } from "@/landing/Hero/Hero";
import { Nav } from "@/landing/Nav/Nav";
import { Starfield } from "@/landing/Starfield/Starfield";
import { getLatestRelease } from "@/release/latestRelease";

export default async function Home() {
  const release = await getLatestRelease();
  return (
    <>
      <Starfield />
      <Nav downloadUrl={release.downloadUrl} />
      <main>
        <Hero />
        <DemoCanvas />
        <Feature />
        <Closing />
      </main>
    </>
  );
}
