import { createContext, useContext } from "react";

export type MenuPosition = "bottom-start" | "bottom-end" | "bottom" | "top-start" | "top-end";

export interface MenuClassNames {
  dropdown?: string;
  item?: string;
  label?: string;
  itemSection?: string;
}

export interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  controlled: boolean;
  close: () => void;
  anchorRef: { current: HTMLElement | null };
  position: MenuPosition;
  width: number | undefined;
  offset: number;
  classNames: MenuClassNames;
}

export const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("Menu.* must be rendered inside <Menu>");
  }
  return ctx;
}

export interface SubContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  itemRef: { current: HTMLElement | null };
}

export const SubContext = createContext<SubContextValue | null>(null);

export function useSubContext(): SubContextValue {
  const ctx = useContext(SubContext);
  if (!ctx) {
    throw new Error("Menu.Sub.* must be rendered inside Menu.Sub");
  }
  return ctx;
}
