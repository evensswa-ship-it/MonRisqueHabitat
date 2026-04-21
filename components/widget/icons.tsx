import type { SVGProps } from "react";

function withClassName(
  props: SVGProps<SVGSVGElement>,
  defaultClassName: string
) {
  return `${defaultClassName} ${props.className ?? ""}`.trim();
}

export function ShieldCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-5 w-5")}
    >
      <path d="M12 3 5 6v5c0 4.97 2.99 8.9 7 10 4.01-1.1 7-5.03 7-10V6l-7-3Z" />
      <path d="m9.5 12.3 1.9 1.9 3.6-4.1" />
    </svg>
  );
}

export function Sparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <path d="m12 2 1.76 4.74L18.5 8.5l-4.74 1.76L12 15l-1.76-4.74L5.5 8.5l4.74-1.76L12 2Zm7 11 1.1 2.9L23 17l-2.9 1.1L19 21l-1.1-2.9L15 17l2.9-1.1L19 13ZM5 14l1.1 2.9L9 18l-2.9 1.1L5 22l-1.1-2.9L1 18l2.9-1.1L5 14Z" />
    </svg>
  );
}

export function House(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-6 w-6")}
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}

export function Search(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-5 w-5")}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function RefreshCcw(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function Download(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function AlertCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-5 w-5")}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function MessageCircleHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <path d="M8 14s-4-3.03-4-6.17A2.83 2.83 0 0 1 6.86 5c1.03 0 1.97.53 2.52 1.34A3.15 3.15 0 0 1 11.9 5c1.59 0 2.88 1.27 2.88 2.83 0 3.14-4 6.17-4 6.17Z" />
      <path d="M20 18a3 3 0 0 1-3 3H8l-4 2V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" />
    </svg>
  );
}

export function ChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function Layers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-5 w-5")}
    >
      <path d="M2 12 12 6l10 6-10 6-10-6Z" />
      <path d="m2 17 10 6 10-6" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

export function Code2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-5 w-5")}
    >
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </svg>
  );
}

export function Palette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-5 w-5")}
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

export function Share2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={withClassName(props, "h-4 w-4")}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Database(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
      className={withClassName(props, "h-5 w-5")}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}
