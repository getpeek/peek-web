"use client";

// Mantine-free stand-in for the desktop Tooltip wrapper: same props and the
// same `pk-tooltip` classname, so the verbatim Tooltip.css applies unchanged.

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Tooltip.css";

export type FloatingPosition =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

interface TooltipProps {
  label: ReactNode;
  children: ReactElement;
  position?: FloatingPosition;
}

const OPEN_DELAY_MS = 400;
const OFFSET = 6;

function placeBubble(
  target: DOMRect,
  bubble: DOMRect,
  position: FloatingPosition,
): { left: number; top: number } {
  const [side, align] = position.split("-") as [string, string | undefined];

  const alongX =
    align === "start"
      ? target.left
      : align === "end"
        ? target.right - bubble.width
        : target.left + target.width / 2 - bubble.width / 2;
  const alongY =
    align === "start"
      ? target.top
      : align === "end"
        ? target.bottom - bubble.height
        : target.top + target.height / 2 - bubble.height / 2;

  if (side === "bottom") {
    return { left: alongX, top: target.bottom + OFFSET };
  }
  if (side === "left") {
    return { left: target.left - bubble.width - OFFSET, top: alongY };
  }
  if (side === "right") {
    return { left: target.right + OFFSET, top: alongY };
  }
  return { left: alongX, top: target.top - bubble.height - OFFSET };
}

export function Tooltip({ label, children, position = "top" }: TooltipProps) {
  const targetRef = useRef<HTMLSpanElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    if (timerRef.current !== null) {
      return;
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setOpen(true);
    }, OPEN_DELAY_MS);
  };

  const hide = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    // The wrapper is display:contents (no box of its own), so the anchor rect
    // comes from the wrapped element itself.
    const target = targetRef.current?.firstElementChild?.getBoundingClientRect();
    const bubble = bubbleRef.current;
    if (!target || !bubble) {
      return;
    }
    const { left, top } = placeBubble(target, bubble.getBoundingClientRect(), position);
    bubble.style.left = `${Math.max(4, Math.min(left, window.innerWidth - bubble.offsetWidth - 4))}px`;
    bubble.style.top = `${Math.max(4, Math.min(top, window.innerHeight - bubble.offsetHeight - 4))}px`;
  }, [open, position]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        ref={targetRef}
        style={{ display: "contents" }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onMouseDown={hide}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={bubbleRef}
            className='pk-tooltip'
            style={{
              position: "fixed",
              left: -9999,
              top: -9999,
              zIndex: 6000,
              pointerEvents: "none",
              animation: "pk-tooltip-fade 120ms ease-out",
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}
