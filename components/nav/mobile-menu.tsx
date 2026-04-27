"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MrhLogo } from "@/components/brand/mrh-logo";

const NAV_LINKS = [
  { label: "Analyser un bien", href: "#analyser" },
  { label: "Fonctionnement", href: "#fonctionnement" },
  { label: "Blog", href: "/blog" },
  { label: "Partenaires", href: "#partenaires" },
];

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <line x1="3" y1="5.5" x2="17" y2="5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="14.5" x2="17" y2="14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline
        points="9,4 13,8 9,12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {/* ── Burger button (mobile only) ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
      >
        <BurgerIcon />
      </button>

      {/* ── Full-screen overlay — portaled to body to escape backdrop-filter stacking context ── */}
      {mounted && createPortal(
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          aria-hidden={!open}
          className={`fixed inset-0 z-50 flex flex-col bg-white transition-[opacity,visibility] duration-250 md:hidden ${
            open ? "visible opacity-100" : "invisible opacity-0"
          }`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
            <a href="/" onClick={close} className="flex items-center gap-3">
              <MrhLogo size={40} className="rounded-2xl" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Mon Risque Habitat</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  by AGS &amp; Co
                </p>
              </div>
            </a>
            <button
              type="button"
              onClick={close}
              aria-label="Fermer le menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-1 flex-col overflow-y-auto px-5 pt-4">
            <ul className="divide-y divide-slate-100">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={close}
                    className="flex items-center justify-between py-5 text-xl font-semibold text-slate-900 transition hover:text-[var(--brand)]"
                  >
                    {label}
                    <span className="text-slate-300">
                      <ChevronRight />
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-auto space-y-3 pb-8 pt-8">
              <a
                href="#analyser"
                onClick={close}
                className="cta-primary cta-lg flex w-full justify-center"
              >
                Analyser une adresse →
              </a>
              <a
                href="#partenaires"
                onClick={close}
                className="cta-secondary cta-lg flex w-full justify-center"
              >
                Demander une démo partenaire
              </a>
              <p className="pt-2 text-center text-xs text-slate-400">
                Données officielles · Gratuit · Sans inscription
              </p>
            </div>
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}
