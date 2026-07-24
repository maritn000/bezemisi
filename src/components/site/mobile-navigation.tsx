"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { navigation } from "@/lib/site-content";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-purple-950 hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{open ? "Zavřít" : "Menu"}</span>
        <span aria-hidden="true" className="text-xl">
          {open ? "×" : "☰"}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 top-[72px] z-40 bg-purple-950/30">
          <button
            type="button"
            aria-label="Zavřít menu"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <nav
            id={menuId}
            aria-label="Mobilní navigace"
            aria-modal="true"
            role="dialog"
            className="relative ml-auto flex h-full w-[min(84vw,22rem)] flex-col gap-1 overflow-y-auto bg-purple-950 p-6 text-white shadow-2xl"
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="mb-2 self-end rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
              onClick={() => setOpen(false)}
            >
              Zavřít
            </button>
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/kontakt"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-xl bg-green-400 px-5 py-3 text-center font-bold text-purple-950 hover:bg-green-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Kontakt
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
