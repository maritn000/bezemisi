import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { getPublicVehicleDetail } from "@/lib/catalogue/public-catalogue";
import { findPresentedVehicle } from "@/lib/site-content";

type Params = { brand: string; model: string };

export const dynamic = "force-dynamic";

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
    description: `Detail modelu ${vehicle.name} s ověřenými parametry z katalogu Bez emisí.`,
  };
}

function formatPrice(price: number | null, currency: string | null) {
  if (price === null) return "Neuvedeno";
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: currency ?? "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { brand, model } = await params;
  const fallback = findPresentedVehicle(brand, model);
  if (!fallback) notFound();

  const detail = await getPublicVehicleDetail(brand, model).catch(() => null);
  const vehicleName = detail?.name ?? fallback.name;
  const category = detail?.category ?? fallback.category;

  const specRows = detail?.specifications ?? [];
  const offer = detail?.offers[0];

  return (
    <>
      <section className="site-section bg-lavender">
        <Container>
          <Breadcrumbs
            items={[
              { href: "/", label: "Úvod" },
              { href: "/elektromobily", label: "Elektromobily" },
              { label: vehicleName },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <p className="font-bold uppercase tracking-[0.15em] text-blue-700">
                {category}
              </p>
              <h1 className="mt-3 text-5xl font-light tracking-[-0.03em] text-purple-950 sm:text-6xl">
                {vehicleName}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-950/70">
                {detail
                  ? "Níže jsou uvedeny pouze ověřené parametry a aktuální nabídkové informace z katalogu."
                  : "Pro tento model zatím nemáme v katalogu ověřené varianty. AI poradce nebude parametry odhadovat."}
              </p>
              {detail && detail.variants.length > 1 && (
                <p className="mt-3 text-sm text-purple-950/65">
                  K dispozici je {detail.variants.length} ověřených variant.
                  Pro přesné srovnání se zeptejte AI poradce.
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink
                  href={`/chat?q=${encodeURIComponent(`Co umíš říct o modelu ${vehicleName}?`)}&send=1`}
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
              <div
                className="aspect-video rounded-[1.1rem] bg-[linear-gradient(135deg,#f0f0ff_0%,#dfe8ff_45%,#c8ffdf_100%)]"
                role="img"
                aria-label={`Ilustrační placeholder pro ${vehicleName}`}
              />
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  [
                    "Dojezd",
                    specRows.find((row) => row.label === "WLTP dojezd")?.value ??
                      "Neuvedeno",
                  ],
                  [
                    "Nabíjení",
                    specRows.find((row) => row.label === "Max. DC nabíjení")
                      ?.value ?? "Neuvedeno",
                  ],
                  [
                    "Cena",
                    offer
                      ? `${formatPrice(offer.price, offer.currency)} (pozorováno ${offer.observedAt})`
                      : "Neuvedeno",
                  ],
                  [
                    "Dostupnost",
                    offer ? "Ověřená nabídka v katalogu" : "Neuvedeno",
                  ],
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
        title={`Chcete se zeptat na ${vehicleName}?`}
        description="AI poradce zůstane u vozů a služeb Bez emisí. Chybějící ověřené údaje nebude odhadovat."
      />
    </>
  );
}
