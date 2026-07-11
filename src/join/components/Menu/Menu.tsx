"use client";

// Minimal Mantine-Menu-subset used by the ported Result menus: controlled or
// click-toggled, portals to body (the `.app-node` translateZ(0) containing
// block breaks fixed descendants), hover submenus, closes on item click,
// outside pointerdown and Escape. Visuals come from the callers' `classNames`
// (styled in Result.css); Menu.css only carries structure.

import {
  cloneElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import {
  MenuContext,
  useMenuContext,
  type MenuClassNames,
  type MenuContextValue,
  type MenuPosition,
} from "./context";
import { MenuSub } from "./MenuSub";
import "./Menu.css";

interface MenuProps {
  children: ReactNode;
  opened?: boolean;
  onClose?: () => void;
  position?: MenuPosition;
  width?: number;
  offset?: number;
  radius?: string;
  withinPortal?: boolean;
  classNames?: MenuClassNames;
}

function MenuRoot({
  children,
  opened,
  onClose,
  position = "bottom-start",
  width,
  offset = 4,
  classNames = {},
}: MenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const controlled = opened !== undefined;
  const open = controlled ? opened : uncontrolledOpen;

  const close = () => {
    if (!controlled) {
      setUncontrolledOpen(false);
    }
    onClose?.();
  };

  return (
    <MenuContext.Provider
      value={{
        open,
        setOpen: setUncontrolledOpen,
        controlled,
        close,
        anchorRef,
        position,
        width,
        offset,
        classNames,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

function MenuTarget({ children }: { children: ReactElement }) {
  const ctx = useMenuContext();
  const child = children as ReactElement<{
    ref?: Ref<HTMLElement>;
    onClick?: (e: React.MouseEvent) => void;
  }>;
  const childOnClick = child.props.onClick;
  return cloneElement(child, {
    ref: (el: HTMLElement | null) => {
      ctx.anchorRef.current = el;
    },
    onClick: (e: React.MouseEvent) => {
      childOnClick?.(e);
      if (!ctx.controlled) {
        ctx.setOpen(!ctx.open);
      }
    },
  });
}

function placeDropdown(el: HTMLDivElement, anchor: DOMRect, ctx: MenuContextValue) {
  const rect = el.getBoundingClientRect();
  const left =
    ctx.position === "bottom-end" || ctx.position === "top-end"
      ? anchor.right - rect.width
      : ctx.position === "bottom"
        ? anchor.left + anchor.width / 2 - rect.width / 2
        : anchor.left;
  const top = ctx.position.startsWith("top")
    ? anchor.top - rect.height - ctx.offset
    : anchor.bottom + ctx.offset;
  el.style.left = `${Math.max(4, Math.min(left, window.innerWidth - rect.width - 4))}px`;
  el.style.top = `${Math.max(4, Math.min(top, window.innerHeight - rect.height - 4))}px`;
}

function MenuDropdown({ children }: { children: ReactNode }) {
  const ctx = useMenuContext();
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!ctx.open) {
      return;
    }
    const el = ref.current;
    const anchor = ctx.anchorRef.current?.getBoundingClientRect();
    if (el && anchor) {
      placeDropdown(el, anchor, ctx);
    }
  });

  useEffect(() => {
    if (!ctx.open) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || ctx.anchorRef.current?.contains(target)) {
        return;
      }
      // Submenu dropdowns are separate body portals; treat them as inside.
      if (target instanceof Element && target.closest(".pk-menu-dropdown")) {
        return;
      }
      ctx.close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ctx.close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ctx.open]);

  if (!ctx.open) {
    return null;
  }
  return createPortal(
    <div
      ref={ref}
      className={`pk-menu-dropdown ${ctx.classNames.dropdown ?? ""}`}
      style={{ width: ctx.width }}
      role='menu'
    >
      {children}
    </div>,
    document.body,
  );
}

interface MenuItemProps {
  children: ReactNode;
  leftSection?: ReactNode;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
  closeOnClick?: boolean;
}

function MenuItem({
  children,
  leftSection,
  onClick,
  color,
  disabled,
  closeOnClick,
}: MenuItemProps) {
  const ctx = useMenuContext();
  return (
    <button
      type='button'
      role='menuitem'
      disabled={disabled}
      className={`pk-menu-item ${ctx.classNames.item ?? ""}`}
      style={color === "red" ? { color: "var(--pk-red)" } : undefined}
      onClick={() => {
        onClick?.();
        if (closeOnClick !== false) {
          ctx.close();
        }
      }}
    >
      {leftSection && (
        <span className={`pk-menu-item-section ${ctx.classNames.itemSection ?? ""}`}>
          {leftSection}
        </span>
      )}
      <span className='pk-menu-item-body'>{children}</span>
    </button>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  const ctx = useMenuContext();
  return <div className={`pk-menu-label ${ctx.classNames.label ?? ""}`}>{children}</div>;
}

function MenuDivider() {
  return <div className='pk-menu-divider' />;
}

export const Menu = Object.assign(MenuRoot, {
  Target: MenuTarget,
  Dropdown: MenuDropdown,
  Item: MenuItem,
  Label: MenuLabel,
  Divider: MenuDivider,
  Sub: MenuSub,
});
