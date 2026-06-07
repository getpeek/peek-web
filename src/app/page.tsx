import { DemoCanvas } from "@/landing/DemoCanvas/DemoCanvas";
import { Hero } from "@/landing/Hero/Hero";
import { Nav } from "@/landing/Nav/Nav";
import { Starfield } from "@/landing/Starfield/Starfield";

export default function Home() {
  return (
    <>
      <Starfield />
      <Nav />
      <main>
        <Hero />
        <DemoCanvas />
      </main>
    </>
  );
}
