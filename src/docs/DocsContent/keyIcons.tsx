import type { ReactNode } from "react";

type KeyIcon = {
  label: string;
  icon: ReactNode;
};

function KeyIconSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='12'
      height='12'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {children}
    </svg>
  );
}

/* Symbol keys render as icons for legibility; anything not in the map
   (letters, brackets, "esc") stays text. */
export const keyIcons: Record<string, KeyIcon> = {
  "⌘": {
    label: "Command",
    icon: (
      <KeyIconSvg>
        <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
      </KeyIconSvg>
    ),
  },
  "⇧": {
    label: "Shift",
    icon: (
      <KeyIconSvg>
        <path d='M9 18v-6H5l7-7 7 7h-4v6H9z' />
      </KeyIconSvg>
    ),
  },
  "↑": {
    label: "Arrow up",
    icon: (
      <KeyIconSvg>
        <path d='M12 19V5' />
        <path d='m5 12 7-7 7 7' />
      </KeyIconSvg>
    ),
  },
  "↓": {
    label: "Arrow down",
    icon: (
      <KeyIconSvg>
        <path d='M12 5v14' />
        <path d='m19 12-7 7-7-7' />
      </KeyIconSvg>
    ),
  },
  "←": {
    label: "Arrow left",
    icon: (
      <KeyIconSvg>
        <path d='M19 12H5' />
        <path d='m12 19-7-7 7-7' />
      </KeyIconSvg>
    ),
  },
  "→": {
    label: "Arrow right",
    icon: (
      <KeyIconSvg>
        <path d='M5 12h14' />
        <path d='m12 5 7 7-7 7' />
      </KeyIconSvg>
    ),
  },
};
