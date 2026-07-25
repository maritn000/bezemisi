import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleGrid } from "@/components/site/vehicle-grid";
import { enrichVehicleCard } from "@/lib/catalogue/vehicle-assets";
import { getPublicVehicleCards } from "@/lib/catalogue/public-catalogue";
import { presentedVehicles } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Elektromobily",
  description:
    "Přehled elektromobilů prezentovaných Bez emisí a ověřené parametry z katalogu.",
};

export const dynamic = "force-dynamic";

export default async function ElectricVehiclesPage() {
  type VehicleListItem = {
    name: string;
    category: string;
    brand: string;
    model: string;
    href: string;
    image: string;
    imageAlt: string;
    tagline?: string;
    rangeKm: number | null;
    priceFrom: number | null;
    observedAt: string | null;
  };

  let vehicles: VehicleListItem[] = presentedVehicles.map((vehicle) =>
    enrichVehicleCard({
      name: vehicle.name,
      category: vehicle.category,
      brand: vehicle.brand,
      model: vehicle.model,
      href: vehicle.href,
      image: vehicle.image,
      imageAlt: vehicle.imageAlt,
      tagline: vehicle.tagline,
      rangeKm: null,
      priceFrom: null,
      observedAt: null,
    }),
  );

  try {
    const catalogueCards = await getPublicVehicleCards();
    if (catalogueCards.length > 0) {
      vehicles = catalogueCards.map((card) =>
        enrichVehicleCard({
          ...card,
          tagline: findTagline(card.brand, card.model),
        }),
      );
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
        primary={{ href: "/chat", label: "Zeptat se AI poradce" }}
        secondary={{ href: "/jak-vybrat", label: "Jak vybrat vůz" }}
        image="/sections/city.jpg"
        imageAlt="Elektromobily ve městě"
      />
      <section className="site-section bg-white">
        <Container>
          <SectionHeading
            title="Modely v prezentaci Bez emisí"
            description="Zobrazeny jsou ověřené hodnoty z katalogu. Chybějící údaje zůstávají prázdné."
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
            {[
              {
                title: "Do města",
                text: "Kompaktní rozměry, snadné parkování a pravidelné nabíjení.",
                image: "/sections/city.jpg",
              },
              {
                title: "Pro rodinu",
                text: "Prostor, bezpečnost a pohodlí pro delší cesty s dětmi.",
                image: "/vehicles/kia-ev3.jpg",
              },
              {
                title: "Na delší cesty",
                text: "Dojezd, rychlé nabíjení a jistota na dálnici.",
                image: "/vehicles/volvo-ex30.jpg",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-[1.25rem] bg-white"
              >
                <div
                  className="aspect-[4/3] bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                  role="img"
                  aria-label={item.title}
                />
                <div className="p-7 text-center">
                  <h3 className="text-2xl font-light">{item.title}</h3>
                  <p className="mt-3 leading-7 text-purple-950/70">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <CtaSection />
    </>
  );
}

function findTagline(brand: string, model: string) {
  return presentedVehicles.find(
    (vehicle) => vehicle.brand === brand && vehicle.model === model,
  )?.tagline;
}
