import Link from "next/link";

import { footerGuideLinks, navigation } from "@/lib/site-content";

import { Container } from "./container";
import { InquiryForm } from "./inquiry-form";
import { Logo } from "./logo";

export function Footer() {
  const mainNav = navigation.filter((item) => item.href !== "/chat");

  return (
    <footer>
      <section className="border-t border-purple-950/10 bg-white">
        <Container className="grid gap-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-medium text-purple-950">
              Přihlaste se k odběru novinek
            </h2>
            <p className="mt-2 max-w-2xl text-purple-950/70">
              Zadejte svůj e-mail a my vám budeme posílat novinky a zajímavosti,
              které stojí za to.
            </p>
          </div>
          <InquiryForm variant="newsletter" />
        </Container>
      </section>

      <div className="bg-purple-950 text-white">
        <Container className="grid gap-10 py-14 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
              Specializovaný prodejce elektromobilů. Pomůžeme s výběrem,
              nabíjením a cestou k vašemu novému vozu.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <nav aria-label="Navigace v patičce">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">
                Stránky
              </p>
              <ul className="space-y-2 text-sm">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/80 hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/kontakt"
                    className="text-white/80 hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
                  >
                    Kontakt
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Průvodce v patičce">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">
                Průvodce
              </p>
              <ul className="space-y-2 text-sm">
                {footerGuideLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-white/80 hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Další odkazy">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">
                Informace
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/mapa-stranek"
                    className="text-white/80 hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
                  >
                    Mapa stránek
                  </Link>
                </li>
                <li>
                  <Link
                    href="/chat"
                    className="text-white/80 hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-400"
                  >
                    AI poradce
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </Container>
      </div>
      <div className="bg-[#15043d] text-white/60">
        <Container className="flex flex-col gap-3 py-5 text-xs">
          <p>
            Veškeré uvedené informace slouží pouze k informativním účelům a
            nepředstavují nabídku podle § 1732 odst. 2 zákona č. 89/2012 Sb.,
            občanského zákoníku.
          </p>
          <p>
            Provozovatel webu: Bez emisí s.r.o. / Bucharova 2657/12, Stodůlky,
            158 00 Praha 5 / IČ: 22253726 / Společnost je zapsaná v obchodním
            rejstříku vedeném u Městského soudu v Praze pod spisovou značkou C
            413303
          </p>
          <p className="text-white/50">
            Všechna práva vyhrazena © {new Date().getFullYear()} Bez emisí
          </p>
        </Container>
      </div>
    </footer>
  );
}
