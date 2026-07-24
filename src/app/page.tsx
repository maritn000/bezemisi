import Link from "next/link";

import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleGrid } from "@/components/site/vehicle-grid";
import { exampleQuestions, presentedVehicles } from "@/lib/site-content";

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Elektromobilita bez zbytečných složitostí"
        title="Najděte elektromobil, který vám opravdu sedne"
        description="Zeptejte se na dojezd, nabíjení, výbavu, cenu nebo podmínky nákupu vozů v nabídce Bez emisí."
        secondary={{ href: "/elektromobily", label: "Prohlédnout vozy" }}
      />

      <section className="site-section bg-white">
        <Container>
          <SectionHeading
            eyebrow="AI poradce"
            title="Najděte elektromobil, který vám opravdu sedne"
            description="Zeptejte se na dojezd, nabíjení, výbavu, cenu nebo podmínky nákupu vozů v nabídce Bez emisí."
            centered
          />
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/chat" variant="blue">
              Zeptat se AI poradce
            </ButtonLink>
          </div>
          <div className="mx-auto mt-9 grid max-w-5xl gap-3 sm:grid-cols-2">
            {exampleQuestions.map((question) => (
              <Link
                key={question}
                href={`/chat?q=${encodeURIComponent(question)}&send=1`}
                className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-purple-950/10 bg-lavender px-5 py-4 font-medium text-purple-950 transition duration-300 hover:border-blue-700 hover:bg-white hover:shadow-[0_12px_30px_rgba(31,5,86,.08)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <span>{question}</span>
                <span
                  aria-hidden="true"
                  className="text-2xl text-blue-700 transition group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="site-section bg-lavender">
        <Container>
          <SectionHeading
            eyebrow="Elektromobily"
            title="Modely prezentované Bez emisí"
            description="Názvy modelů slouží jako orientační rozcestník. Parametry a obchodní údaje zobrazíme až z ověřeného katalogu."
          />
          <VehicleGrid vehicles={presentedVehicles} />
          <ButtonLink href="/elektromobily" variant="outline" className="mt-9">
            Všechny elektromobily
          </ButtonLink>
        </Container>
      </section>

      <section className="site-section bg-white">
        <Container className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <SectionHeading
            eyebrow="Jak pomáháme"
            title="Od prvních otázek k ověřené nabídce"
            description="Technické informace mají smysl jen ve vztahu k tomu, jak vůz používáte."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["01", "Ujasníme potřeby", "Denní cesty, nabíjení, prostor a rozpočet."],
              ["02", "Porovnáme fakta", "Pouze údaje z ověřeného katalogu se zdrojem."],
              ["03", "Vysvětlíme rozdíly", "Parametry oddělíme od praktického doporučení."],
              ["04", "Předáme ke kontaktu", "Aktuální cenu a dostupnost potvrdí specialista."],
            ].map(([number, title, text]) => (
              <article
                key={number}
                className="rounded-[1.25rem] border border-purple-950/10 p-6 transition duration-300 hover:-translate-y-0.5"
              >
                <span className="font-bold text-blue-700">{number}</span>
                <h3 className="mt-3 text-2xl font-light">{title}</h3>
                <p className="mt-2 leading-7 text-purple-950/70">{text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <CtaSection
        title="Ptejte se na to, co řešíte právě teď"
        description="AI poradce je omezený na elektromobily a služby Bez emisí. Když ověřený údaj chybí, řekne to."
        label="Zeptat se AI poradce"
      />
    </>
  );
}
