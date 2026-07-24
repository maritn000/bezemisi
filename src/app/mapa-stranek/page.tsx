import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Hero } from "@/components/site/hero";
import { sitemapLinks } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Mapa stránek",
  description: "Přehled všech stránek webu Bez emisí.",
};

export default function SitemapPage() {
  return (
    <>
      <Hero
        eyebrow="Mapa stránek"
        title="Přehled stránek"
        description="Rychlá navigace po celém webu Bez emisí."
        primary={{ href: "/elektromobily", label: "Elektromobily" }}
        image="/sections/guide.jpg"
        imageAlt="Navigace po webu"
      />
      <section className="site-section bg-white">
        <Container>
          <nav aria-label="Mapa stránek">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sitemapLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-xl bg-lavender px-5 py-4 font-medium text-purple-950 transition hover:bg-blue-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>
    </>
  );
}
