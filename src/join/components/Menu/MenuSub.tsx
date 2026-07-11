"use client";

// Hover submenu for the Menu subset. Sub.Target wraps a Sub.Item (the
// hoverable row); Sub.Dropdown opens beside it in its own body portal and
// shares the root menu's close-on-item-click behavior.

import {
  cloneElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { SubContext, useMenuContext, useSubContext, type SubContextValue } from "./context";

const SUB_CLOSE_DELAY_MS = 120;

function MenuSubRoot({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef<HTMLElement | null>(null);
  return <SubContext.Provider value={{ open, setOpen, itemRef }}>{children}</SubContext.Provider>;
}

function useSubHover(sub: SubContextValue) {
  const timer = useRef<number | null>(null);
  return {
    enter: () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      sub.setOpen(true);
    },
    leave: () => {
      timer.current = window.setTimeout(() => sub.setOpen(false), SUB_CLOSE_DELAY_MS);
    },
  };
}

function MenuSubTarget({ children }: { children: ReactElement }) {
  const sub = useSubContext();
  const hover = useSubHover(sub);
  const child = children as ReactElement<{
    ref?: Ref<HTMLElement>;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }>;
  return cloneElement(child, {
    ref: (el: HTMLElement | null) => {
      sub.itemRef.current = el;
    },
    onMouseEnter: hover.enter,
    onMouseLeave: hover.leave,
  });
}

function MenuSubItem({
  children,
  leftSection,
  disabled,
}: {
  children: ReactNode;
  leftSection?: ReactNode;
  disabled?: boolean;
}) {
  const ctx = useMenuContext();
  return (
    <button
      type='button'
      role='menuitem'
      disabled={disabled}
      className={`pk-menu-item pk-menu-subitem ${ctx.classNames.item ?? ""}`}
    >
      {leftSection && (
        <span className={`pk-menu-item-section ${ctx.classNames.itemSection ?? ""}`}>
          {leftSection}
        </span>
      )}
      <span className='pk-menu-item-body'>{children}</span>
      <span className='pk-menu-sub-chevron'>›</span>
    </button>
  );
}

function MenuSubDropdown({ children }: { children: ReactNode }) {
  const ctx = useMenuContext();
  const sub = useSubContext();
  const hover = useSubHover(sub);
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!sub.open) {
      return;
    }
    const el = ref.current;
    const anchor = sub.itemRef.current?.getBoundingClientRect();
    if (!el || !anchor) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const left =
      anchor.right + rect.width + 4 > window.innerWidth
        ? anchor.left - rect.width - 2
        : anchor.right + 2;
    const top = Math.max(4, Math.min(anchor.top - 4, window.innerHeight - rect.height - 4));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  });

  if (!sub.open) {
    return null;
  }
  return createPortal(
    <div
      ref={ref}
      className={`pk-menu-dropdown ${ctx.classNames.dropdown ?? ""}`}
      role='menu'
      onMouseEnter={hover.enter}
      onMouseLeave={hover.leave}
    >
      {children}
    </div>,
    document.body,
  );
}

export const MenuSub = Object.assign(MenuSubRoot, {
  Target: MenuSubTarget,
  Item: MenuSubItem,
  Dropdown: MenuSubDropdown,
});
