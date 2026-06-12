"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import type { EventName } from "./events";
import { track } from "./track";

type TrackedLinkProps = { event: EventName } & ComponentPropsWithoutRef<"a">;

// An <a> that counts its clicks. Carries no styles of its own - callers pass
// their existing classes - so server components (Hero, Install) can swap their
// plain anchors for this without any visual change.
export function TrackedLink({ event, onClick, ...anchorProps }: TrackedLinkProps) {
  const handleClick = (mouseEvent: MouseEvent<HTMLAnchorElement>) => {
    track(event);
    onClick?.(mouseEvent);
  };

  return <a {...anchorProps} onClick={handleClick} />;
}
