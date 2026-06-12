// Inline SVG icons lifted from the desktop app's toolbar (@tabler/icons).
// peek-web has no icon library - these mirror the Tabler paths pixel-for-pixel
// so the demo toolbar matches the product. Size is set by CSS (16px).

interface IconProps {
  className?: string;
}

function Icon({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {children}
    </svg>
  );
}

export function MouseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M6 7a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-4a4 4 0 0 1 -4 -4l0 -10' />
      <path d='M12 7l0 4' />
    </Icon>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M7 8l-4 4l4 4' />
      <path d='M17 8l4 4l-4 4' />
      <path d='M14 4l-4 16' />
    </Icon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6' />
    </Icon>
  );
}

export function LetterTIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M6 4l12 0' />
      <path d='M12 4l0 16' />
    </Icon>
  );
}

export function AtIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0' />
      <path d='M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0 -5.5 8.28' />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4' />
      <path d='M13.5 6.5l4 4' />
    </Icon>
  );
}
