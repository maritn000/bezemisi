import Link from "next/link";

import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleCard } from "@/components/site/vehicle-card";
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
        <div className="site-container">
          <SectionHeading
            eyebrow="AI poradce"
            title="Začněte otázkou, která je pro vás důležitá"
            description="Poradce zatím pracuje bez připojeného katalogu a chybějící parametry nebude odhadovat."
            centered
          />
          <div className="mx-auto mt-9 grid max-w-5xl gap-3 sm:grid-cols-2">
            {exampleQuestions.map((question) => (
              <Link
                key={question}
                href={`/chat?q=${encodeURIComponent(question)}`}
                className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-purple-950/10 bg-lavender px-5 py-4 font-medium text-purple-950 transition hover:border-blue-700 hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
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
        </div>
      </section>

      <section className="site-section bg-lavender">
        <div className="site-container">
          <SectionHeading
            eyebrow="Elektromobily"
            title="Modely prezentované Bez emisí"
            description="Názvy modelů slouží jako orientační rozcestník. Parametry a obchodní údaje zobrazíme až z ověřeného katalogu."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {presentedVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
          <Link
            href="/elektromobily"
            className="button button-outline mt-9"
          >
            Všechny elektromobily
          </Link>
        </div>
      </section>

      <section className="site-section bg-white">
        <div className="site-container grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
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
                className="rounded-[1.25rem] border border-purple-950/10 p-6"
              >
                <span className="font-bold text-blue-700">{number}</span>
                <h3 className="mt-3 text-2xl font-light">{title}</h3>
                <p className="mt-2 leading-7 text-purple-950/70">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Ptejte se na to, co řešíte právě teď"
        description="AI poradce je omezený na elektromobily a služby Bez emisí. Když ověřený údaj chybí, řekne to."
      />
    </>
  );
}
