"use client";

import { useState } from "react";
import { WaitlistModal } from "./waitlist-modal";

function LockIcon() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden="true">
      <rect x="1.75" y="6" width="9.5" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 6V4.5a3 3 0 0 1 6 0V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WaitlistNavButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-[var(--brand)] hover:text-[var(--brand)] md:flex"
      >
        <LockIcon />
        Assistant IA
        <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--brand)]">
          Bientôt
        </span>
      </button>

      <WaitlistModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
