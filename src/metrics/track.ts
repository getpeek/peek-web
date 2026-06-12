import type { EventName } from "./events";

const ENDPOINT = "/metrics/events";

function optedOut(): boolean {
  if (navigator.doNotTrack === "1") {
    return true;
  }
  return "globalPrivacyControl" in navigator && navigator.globalPrivacyControl === true;
}

// Fire-and-forget: never throws and is never awaited, so a missing database or
// a blocked request can't affect the visitor. No-ops during SSR and for
// visitors signalling Do Not Track / Global Privacy Control.
export function track(event: EventName): void {
  if (typeof navigator === "undefined" || optedOut()) {
    return;
  }
  // sendBeacon survives the page unloading mid-request (e.g. a CTA navigation)
  if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, event)) {
    return;
  }
  void fetch(ENDPOINT, { method: "POST", body: event, keepalive: true }).catch(() => {
    // losing a count beats surfacing an error to the visitor
  });
}
