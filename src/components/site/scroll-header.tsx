"use client";

import { useEffect, useState } from "react";

export function ScrollHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-purple-950/5 bg-white/95 backdrop-blur"
          : "border-transparent bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}
