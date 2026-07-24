import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleGrid } from "@/components/site/vehicle-grid";
import { getPublicVehicleCards } from "@/lib/catalogue/public-catalogue";
import { presentedVehicles } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Elektromobily",
  description:
    "Přehled elektromobilů prezentovaných Bez emisí a ověřené parametry z katalogu.",
};

export const dynamic = "force-dynamic";

export default async function ElectricVehiclesPage() {
  let vehicles: Array<{
    name: string;
    category: string;
    href: string;
    rangeKm: number | null;
    priceFrom: number | null;
    observedAt: string | null;
  }> = presentedVehicles.map((vehicle) => ({
    name: vehicle.name,
    category: vehicle.category,
    href: vehicle.href,
    rangeKm: null,
    priceFrom: null,
    observedAt: null,
  }));

  try {
    const catalogueCards = await getPublicVehicleCards();
    if (catalogueCards.length > 0) {
      vehicles = catalogueCards.map((card) => ({
        name: card.name,
        category: card.category,
        href: card.href,
        rangeKm: card.rangeKm,
        priceFrom: card.priceFrom,
        observedAt: card.observedAt,
      }));
    }
  } catch {
    // Fallback to static presentation when database is unavailable.
  }

  return (
    <>
      <Hero
        eyebrow="Elektromobily"
        title="Pořídit si elektroauto? Začněte svými potřebami."
        description="Prohlédněte si modely prezentované Bez emisí. U každého uvedeného údaje pocházejí z ověřeného katalogu se zdrojem a datem pozorování."
        secondary={{ href: "/jak-vybrat", label: "Jak vybrat vůz" }}
      />
      <section className="site-section bg-white">
        <Container>
          <SectionHeading
            title="Modely v prezentaci Bez emisí"
            description="Zobrazeny jsou pouze ověřené hodnoty z katalogu. Chybějící údaje zůstávají prázdné."
          />
          <VehicleGrid vehicles={vehicles} />
        </Container>
      </section>
      <section className="site-section bg-lavender">
        <Container>
          <SectionHeading
            eyebrow="Podle využití"
            title="Neexistuje jeden nejlepší elektromobil"
            description="Jiný vůz dává smysl pro krátké městské trasy, jiný pro rodinu nebo časté dálniční cesty."
            centered
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {["Do města", "Pro rodinu", "Na delší cesty"].map((title) => (
              <article
                key={title}
                className="rounded-[1.25rem] bg-white p-7 text-center"
              >
                <h3 className="text-2xl font-light">{title}</h3>
                <p className="mt-3 leading-7 text-purple-950/70">
                  AI poradce se nejprve doptá na vaše podmínky a teprve potom
                  může pracovat s ověřeným srovnáním.
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <CtaSection />
    </>
  );
}
