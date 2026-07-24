import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { findPresentedVehicle } from "@/lib/site-content";

type Params = { brand: string; model: string };

export async function generateStaticParams() {
  return [
    { brand: "hyundai", model: "inster" },
    { brand: "volvo", model: "ex30" },
    { brand: "kia", model: "ev3" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const vehicle = findPresentedVehicle(brand, model);
  if (!vehicle) {
    return { title: "Vůz nenalezen" };
  }
  return {
    title: vehicle.name,
    description: `Orientační stránka modelu ${vehicle.name}. Ověřené parametry budou doplněny z katalogu.`,
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { brand, model } = await params;
  const vehicle = findPresentedVehicle(brand, model);
  if (!vehicle) notFound();

  return (
    <>
      <section className="site-section bg-lavender">
        <Container>
          <Breadcrumbs
            items={[
              { href: "/", label: "Úvod" },
              { href: "/elektromobily", label: "Elektromobily" },
              { label: vehicle.name },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <p className="font-bold uppercase tracking-[0.15em] text-blue-700">
                {vehicle.category}
              </p>
              <h1 className="mt-3 text-5xl font-light tracking-[-0.03em] text-purple-950 sm:text-6xl">
                {vehicle.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-950/70">
                Tato stránka připravuje detail modelu podle veřejné struktury
                Bez emisí. Konkrétní dojezd, nabíjení, cenu ani dostupnost zde
                zatím neuvádíme — ověřený katalog ještě není připojen.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink
                  href={`/chat?q=${encodeURIComponent(`Co umíš říct o modelu ${vehicle.name}?`)}&send=1`}
                  variant="blue"
                >
                  Zeptat se AI poradce
                </ButtonLink>
                <ButtonLink href="/kontakt" variant="outline">
                  Osobní kontakt
                </ButtonLink>
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] bg-white p-4 ring-1 ring-purple-950/8">
              {/* Local placeholder — production vehicle photography is not hotlinked. */}
              <div
                className="aspect-video rounded-[1.1rem] bg-[linear-gradient(135deg,#f0f0ff_0%,#dfe8ff_45%,#c8ffdf_100%)]"
                role="img"
                aria-label={`Ilustrační placeholder pro ${vehicle.name}`}
              />
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Dojezd", "Čeká na ověřený katalog"],
                  ["Nabíjení", "Čeká na ověřený katalog"],
                  ["Cena", "Neuvádíme bez ověření"],
                  ["Dostupnost", "Neuvádíme bez ověření"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-lavender px-4 py-3"
                  >
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm text-purple-950/75">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>
      <CtaSection
        title={`Chcete se zeptat na ${vehicle.name}?`}
        description="AI poradce zůstane u vozů a služeb Bez emisí. Chybějící ověřené údaje nebude odhadovat."
      />
    </>
  );
}
