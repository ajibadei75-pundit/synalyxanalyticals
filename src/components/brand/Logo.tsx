interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="SYNALYX mark"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 6 L83 25 A12 12 0 0 1 89 35 L89 65 A12 12 0 0 1 83 75 L50 94 L17 75 A12 12 0 0 1 11 65 L11 35 A12 12 0 0 1 17 25 Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <g transform="translate(50 50)">
        <path d="M0 -26 A26 26 0 0 1 22 -13 L0 0 Z" fill="currentColor" />
        <path
          d="M0 -26 A26 26 0 0 1 22 -13 L0 0 Z"
          fill="currentColor"
          transform="rotate(120)"
        />
        <path
          d="M0 -26 A26 26 0 0 1 22 -13 L0 0 Z"
          fill="currentColor"
          transform="rotate(240)"
        />
        <circle r="6.5" fill="currentColor" opacity="0.35" />
      </g>
    </svg>
  );
}

export function Logo({ className = "", showWordmark = true, showTagline = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 text-foreground ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold uppercase tracking-[-0.04em]">
            Synalyx
          </span>
          {showTagline && (
            <span className="mt-1 text-[10px] font-medium tracking-tight text-muted-foreground">
              Synchronized data, Simplified decisions
            </span>
          )}
        </span>
      )}
    </span>
  );
}
