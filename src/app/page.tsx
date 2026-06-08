import { Closing } from "@/landing/Closing/Closing";
import { DemoCanvas } from "@/landing/DemoCanvas/DemoCanvas";
import { Feature } from "@/landing/Feature/Feature";
import { Hero } from "@/landing/Hero/Hero";
import { Nav } from "@/landing/Nav/Nav";
import { Starfield } from "@/landing/Starfield/Starfield";
import { Stats } from "@/landing/Stats/Stats";

export default function Home() {
  return (
    <>
      <Starfield />
      <Nav />
      <main>
        <Hero />
        <DemoCanvas />
        <Feature />
        <Stats />
        <Closing />
      </main>
    </>
  );
}
