import Image from "next/image";
import Link from "next/link";

import { BlogCard } from "@/components/site/blog-card";
import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { ContentCard } from "@/components/site/content-card";
import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { InquiryForm } from "@/components/site/inquiry-form";
import { SectionHeading } from "@/components/site/section-heading";
import { VehicleGrid } from "@/components/site/vehicle-grid";
import {
  blogPosts,
  brandNames,
  exampleQuestions,
  homepageEntryCards,
  homepageFirstTimeCards,
  presentedVehicles,
  purchaseSteps,
} from "@/lib/site-content";

export default function HomePage() {
  return (
    <>
      <Hero
        title="Specializovaný prodejce elektromobilů"
        primary={{ href: "/elektromobily", label: "Objevte nabídku" }}
        secondary={{ href: "/chat", label: "Zeptat se AI poradce" }}
        image="/hero/home-hero.png"
        imageAlt="Elektromobil na pozadí městské krajiny"
      />

      <section className="site-section bg-white">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {homepageEntryCards.map((card) => (
              <ContentCard key={card.title} {...card} />
            ))}
          </div>
        </Container>
      </section>

      <section className="site-section bg-lavender">
        <Container>
          <SectionHeading
            title="Náš cíl je pomoci s výběrem elektromobilu dle vašich individuálních potřeb"
            centered
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              "Zajistíme zkušební jízdu a dostupnost vybraného elektromobilu",
              "Náš prodejce pro vás připraví maximálně výhodnou cenovou nabídku",
              "Specializujeme se na elektromobily a pomůžeme s celým procesem",
            ].map((text) => (
              <p
                key={text}
                className="rounded-[1.25rem] bg-white p-6 text-center leading-7 text-purple-950/80"
              >
                {text}
              </p>
            ))}
          </div>
        </Container>
      </section>

      <section className="site-section bg-purple-950 text-white">
        <Container className="text-center">
          <SectionHeading
            eyebrow="Akční nabídky"
            title="Akce na vozy skladem"
            description="Vybrané modely s výhodnými podmínkami a rychlým dodáním."
            centered
            light
          />
          <ButtonLink href="/akcni-nabidky" variant="green" className="mt-8">
            Zobrazit akční modely
          </ButtonLink>
        </Container>
      </section>

      <section className="site-section bg-white">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow="Nabídka vozidel"
            title="Největší portál pro inzerci elektromobilů v ČR"
            description="Spolupracujeme s ověřenými partnery v celém Česku, se kterými můžete napřímo komunikovat."
          />
          <VehicleGrid vehicles={presentedVehicles.slice(0, 2)} />
        </Container>
        <Container className="mt-6">
          <ButtonLink href="/elektromobily" variant="blue">
            Objevte nabídku
          </ButtonLink>
        </Container>
      </section>

      <section className="site-section bg-lavender">
        <Container>
          <SectionHeading
            eyebrow="Jste tu poprvé?"
            title="Začněte tam, kde vám to dává smysl"
            centered
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {homepageFirstTimeCards.map((card) => (
              <ContentCard
                key={card.title}
                title={card.title}
                description={card.text}
                href={card.href}
                image={card.image}
                imageAlt={card.imageAlt}
                cta="Více"
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="site-section bg-white">
        <Container>
          <SectionHeading
            eyebrow="Nejoblíbenější modely"
            title="Vybrané elektromobily v nabídce"
            centered
          />
          <VehicleGrid vehicles={presentedVehicles} />
          <div className="mt-9 text-center">
            <ButtonLink href="/elektromobily" variant="outline">
              Přehled modelů
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="site-section bg-lavender">
        <Container>
          <SectionHeading
            eyebrow="AI poradce"
            title="Ptejte se na to, co řešíte právě teď"
            description="Zeptejte se na dojezd, nabíjení, výbavu nebo podmínky nákupu vozů v nabídce Bez emisí."
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
                className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-purple-950/10 bg-white px-5 py-4 font-medium text-purple-950 transition duration-300 hover:border-blue-700 hover:shadow-[0_12px_30px_rgba(31,5,86,.08)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
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

      <section className="site-section bg-white">
        <Container>
          <SectionHeading
            eyebrow="Nejnovější články"
            title="Tipy a zajímavosti z blogu"
            centered
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {blogPosts.map((post) => (
              <BlogCard key={post.slug} {...post} />
            ))}
          </div>
          <div className="mt-9 text-center">
            <ButtonLink href="/blog" variant="outline">
              Více článků
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="site-section bg-lavender">
        <Container>
          <SectionHeading eyebrow="Naše značky" title="Zastoupené značky" centered />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {brandNames.map((brand) => (
              <span
                key={brand}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-purple-950 ring-1 ring-purple-950/10"
              >
                {brand}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section className="site-section bg-white">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Kdo jsme?"
              title="Moderní prodejní platforma zaměřená na elektromobily"
              description="Do naší nabídky vybíráme nejzajímavější modely top značek. Naši prodejci pracují s pečlivě vybranými partnery, se kterými vyjednáváme nejvýhodnější nabídky na trhu."
            />
            <ButtonLink href="/o-nas" variant="blue" className="mt-8">
              Více o nás
            </ButtonLink>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
            <Image
              src="/sections/about-team.webp"
              alt="Tým Bez emisí"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>

      <section className="site-section bg-lavender">
        <Container>
          <SectionHeading
            eyebrow="Jak to probíhá"
            title="Nezávazná poptávka pro celou ČR"
            description="Projdeme s vámi celý proces od prvního dotazu až po předání vozu."
            centered
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {purchaseSteps.map((step) => (
              <article
                key={step.number}
                className="rounded-[1.25rem] bg-white p-6 text-center"
              >
                <span className="text-3xl font-light text-blue-700">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-purple-950/70">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl">
            <InquiryForm variant="inquiry" />
          </div>
        </Container>
      </section>

      <CtaSection
        title="Potřebujete poradit s výběrem?"
        description="AI poradce vám pomůže ujasnit požadavky. Závaznou cenu a dostupnost vždy potvrdí osobní kontakt."
        href="/chat"
        label="Zeptat se AI poradce"
      />
    </>
  );
}
