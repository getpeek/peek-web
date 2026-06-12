// Shared by the client tracker and the ingest route - keep it dependency-free
// so it's safe in both bundles.
export const EVENT_NAMES = [
  "cta.nav",
  "cta.hero",
  "cta.docs-install",
  "demo.send",
  "demo.run",
  "demo.reference",
  "demo.chart",
  "demo.share",
  "demo.reset",
  "demo.zoom-in",
  "demo.zoom-out",
  "demo.fit-view",
  "demo.tool.select",
  "demo.tool.query",
  "demo.tool.agent",
  "demo.tool.text",
  "demo.tool.variable",
  "demo.tool.draw",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(value: string): value is EventName {
  return (EVENT_NAMES as readonly string[]).includes(value);
}
