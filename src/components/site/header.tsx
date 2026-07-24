import Link from "next/link";

import { navigation } from "@/lib/site-content";

import { Logo } from "./logo";
import { MobileNavigation } from "./mobile-navigation";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-purple-950/5 bg-white/95 backdrop-blur">
      <div className="site-container flex h-[72px] items-center justify-between gap-6 lg:h-[92px]">
        <Logo />
        <nav
          aria-label="Hlavní navigace"
          className="hidden items-center gap-1 lg:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-3 text-[0.9rem] font-medium text-purple-950 hover:bg-purple-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 xl:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/kontakt"
          className="button button-green !hidden lg:!inline-flex"
        >
          Kontakt
        </Link>
        <MobileNavigation />
      </div>
    </header>
  );
}
