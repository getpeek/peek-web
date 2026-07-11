import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Chewy, JetBrains_Mono, Montserrat, Inter } from "next/font/google";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

// Inter stands in for the paid "Söhne" used in the source design - its variable
// axis covers the italic 900 wordmark and the italic 800 brand mark.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// the product's Text-node font (its --pk-font-playful); used by the demo canvas
const chewy = Chewy({
  variable: "--font-chewy",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Peek - the 2D database client",
  description:
    "A database GUI for people who think in two dimensions, not in queries and results. Explore, edit, chart and chat with your data on an infinite canvas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${jetBrainsMono.variable} ${montserrat.variable} ${inter.variable} ${chewy.variable}`}
    >
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
