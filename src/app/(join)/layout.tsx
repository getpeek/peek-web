import type { Metadata } from "next";
import { Chewy, JetBrains_Mono } from "next/font/google";
import "./join-base.css";

// Own root layout: the join canvas ships the desktop app's global CSS
// (`--pk-*` tokens on :root, bare `.react-flow` rules), which must never mix
// with the marketing group's globals.css. Crossing route groups with separate
// root layouts forces a full document load, so neither side leaks into the
// other.

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// The Text node's --pk-font-playful, same as the desktop app.
const chewy = Chewy({
  variable: "--font-chewy",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Join a Peek session",
  robots: { index: false, follow: false },
};

export default function JoinLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${jetBrainsMono.variable} ${chewy.variable}`}>
      <body>{children}</body>
    </html>
  );
}
