import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleGrid } from "@/components/site/vehicle-grid";
import { presentedVehicles } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Elektromobily",
  description:
    "Přehled elektromobilů v nabídce Bez emisí. Vyberte si model a zjistěte více.",
};

export default function ElectricVehiclesPage() {
  return (
    <>
      <Hero
        eyebrow="Elektromobily"
        title="Pořídit si elektroauto? Začněte svými potřebami."
        description="Největší portál pro inzerci elektromobilů v ČR, kde každý nájde vůz podle svých představ."
        primary={{ href: "/jak-vybrat", label: "Jak vybrat vůz" }}
        secondary={{ href: "/chat", label: "Zeptat se AI poradce" }}
        image="/sections/city.jpg"
        imageAlt="Elektromobily ve městě"
      />
      <section className="site-section bg-white">
        <Container>
          <SectionHeading
            title="Modely v nabídce Bez emisí"
            description="Vyberte model a zjistěte více. Pro konkrétní parametry a nabídku nás kontaktujte."
          />
          <VehicleGrid vehicles={presentedVehicles} />
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
                text: "Kompaktní rozměry, snadné parkování a praktické nabíjení.",
              },
              {
                title: "Pro rodinu",
                text: "Prostor pro cestující, zavazadla a delší cesty.",
              },
              {
                title: "Na delší cesty",
                text: "Dojezd, rychlé nabíjení a komfort na dálnici.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-[1.25rem] bg-white p-7 text-center"
              >
                <h3 className="text-2xl font-light">{item.title}</h3>
                <p className="mt-3 leading-7 text-purple-950/70">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <CtaSection />
    </>
  );
}
