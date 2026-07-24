import type { Metadata } from "next";

import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleCard } from "@/components/site/vehicle-card";
import { presentedVehicles } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Elektromobily",
  description:
    "Přehled elektromobilů prezentovaných Bez emisí a bezpečná cesta k ověřeným parametrům.",
};

export default function ElectricVehiclesPage() {
  return (
    <>
      <Hero
        eyebrow="Elektromobily"
        title="Pořídit si elektroauto? Začněte svými potřebami."
        description="Prohlédněte si orientační přehled modelů. Přesné parametry, ceny a dostupnost neuvádíme, dokud nejsou v ověřeném katalogu."
        secondary={{ href: "/jak-vybrat", label: "Jak vybrat vůz" }}
      />
      <section className="site-section bg-white">
        <div className="site-container">
          <SectionHeading
            title="Modely v prezentaci Bez emisí"
            description="Tato první verze nenahrazuje aktuální skladovou nabídku. U každého faktu bude později uveden zdroj a čas ověření."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presentedVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
        </div>
      </section>
      <section className="site-section bg-lavender">
        <div className="site-container">
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
        </div>
      </section>
      <CtaSection />
    </>
  );
}
