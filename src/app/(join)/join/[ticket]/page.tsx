import type { Metadata } from "next";
import { JoinView } from "@/join/JoinView";

export const metadata: Metadata = {
  title: "Join a Peek session",
  robots: { index: false, follow: false },
};

export default async function JoinPage({ params }: { params: Promise<{ ticket: string }> }) {
  const { ticket } = await params;
  return <JoinView ticket={decodeURIComponent(ticket)} />;
}
