import { CtaSection } from "./cta-section";
import { Hero } from "./hero";
import { SectionHeading } from "./section-heading";

import type { EditorialPage as EditorialPageContent } from "@/lib/site-content";

export function EditorialPage({ page }: { page: EditorialPageContent }) {
  return (
    <>
      <Hero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        secondary={{ href: "/kontakt", label: "Osobní kontakt" }}
      />
      <section className="site-section bg-white">
        <div className="site-container">
          <SectionHeading title={page.introTitle} description={page.intro} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {page.cards.map((card, index) => (
              <article
                key={card.title}
                className="rounded-[1.25rem] bg-lavender p-7"
              >
                <span className="text-sm font-bold text-blue-700">
                  0{index + 1}
                </span>
                <h2 className="mt-4 text-2xl font-light text-purple-950">
                  {card.title}
                </h2>
                <p className="mt-3 leading-7 text-purple-950/70">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
