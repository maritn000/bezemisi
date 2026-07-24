import Link from "next/link";

import { navigation } from "@/lib/site-content";

import { Logo } from "./logo";

export function Footer() {
  return (
    <footer>
      <section className="border-t border-purple-950/10 bg-white">
        <div className="site-container grid gap-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-medium text-purple-950">
              Praktické novinky o elektromobilitě
            </h2>
            <p className="mt-2 max-w-2xl text-purple-950/70">
              Newsletter je v tomto prototypu pouze ukázkou. E-mail se nikam
              neodesílá ani neukládá.
            </p>
          </div>
          <span className="rounded-xl border border-purple-950/15 bg-purple-50 px-5 py-3 text-sm font-semibold text-purple-950">
            Odběr bude dostupný později
          </span>
        </div>
      </section>

      <div className="bg-purple-950 text-white">
        <div className="site-container grid gap-10 py-14 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
              Průvodce výběrem elektromobilu, nabíjením a cestou k ověřené
              nabídce.
            </p>
          </div>
          <nav
            aria-label="Navigace v patičce"
            className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm text-white/80 hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/kontakt"
              className="rounded-sm text-white/80 hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
            >
              Kontakt
            </Link>
          </nav>
        </div>
      </div>
      <div className="bg-[#15043d] text-white/60">
        <div className="site-container flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Bez emisí. Produktový prototyp.</p>
          <p>
            Obsah není závaznou nabídkou. Ceny a dostupnost musí potvrdit
            prodejce.
          </p>
        </div>
      </div>
    </footer>
  );
}
