import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { InquiryForm } from "@/components/site/inquiry-form";
import {
  PurchaseProcess,
  RelatedVehicles,
  VehicleHeroImage,
} from "@/components/site/vehicle-detail";
import { getPublicVehicleDetail } from "@/lib/catalogue/public-catalogue";
import { WLTP_RANGE_LABEL } from "@/lib/catalogue/constants";
import {
  companyInfo,
  findPresentedVehicle,
  getRelatedVehicles,
} from "@/lib/site-content";

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
    description: vehicle.tagline,
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
  const vehicle = findPresentedVehicle(brand, model);
  if (!vehicle) notFound();

  const detail = await getPublicVehicleDetail(brand, model).catch(() => null);
  const related = getRelatedVehicles(brand, model);
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
              { label: vehicle.name },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
            <div>
              <p className="font-bold uppercase tracking-[0.15em] text-blue-700">
                {detail?.category ?? vehicle.category}
              </p>
              <h1 className="mt-3 text-5xl font-light tracking-[-0.03em] text-purple-950 sm:text-6xl">
                {vehicle.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-950/70">
                {detail
                  ? "Níže jsou uvedeny ověřené parametry a aktuální nabídkové informace z katalogu."
                  : vehicle.tagline}
              </p>
              {detail && detail.variants.length > 1 && (
                <p className="mt-3 text-sm text-purple-950/65">
                  K dispozici je {detail.variants.length} ověřených variant.
                  Pro přesné srovnání se zeptejte AI poradce.
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink
                  href={`/chat?q=${encodeURIComponent(`Co umíš říct o modelu ${vehicle.name}?`)}&send=1`}
                  variant="blue"
                >
                  Zeptat se AI poradce
                </ButtonLink>
                <ButtonLink href="/kontakt" variant="green">
                  Nezávazná poptávka
                </ButtonLink>
              </div>
            </div>
            <div className="space-y-5">
              <VehicleHeroImage vehicle={vehicle} />
              {detail && (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      WLTP_RANGE_LABEL,
                      detail.rangeSummary?.label ??
                        specRows.find((row) => row.label === WLTP_RANGE_LABEL)
                          ?.value ??
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
                      className="rounded-xl bg-white px-4 py-3 ring-1 ring-purple-950/8"
                    >
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm text-purple-950/75">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="site-section bg-white">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-light text-purple-950">
              O modelu {vehicle.name}
            </h2>
            <p className="mt-4 leading-7 text-purple-950/70">{vehicle.tagline}</p>
            {detail && specRows.length > 0 && (
              <dl className="mt-8 space-y-4">
                {detail.variantRanges.length > 1 && (
                  <div className="rounded-xl bg-lavender px-5 py-4">
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                      Ověřený dojezd podle varianty
                    </dt>
                    <dd className="mt-3 space-y-2 text-purple-950">
                      {detail.variantRanges.map((variant) => (
                        <p key={variant.name}>
                          <span className="font-medium">{variant.name}</span>
                          {": "}
                          {variant.wltpRangeKm !== null
                            ? `${WLTP_RANGE_LABEL} ${variant.wltpRangeKm} km`
                            : "neuvedeno"}
                        </p>
                      ))}
                    </dd>
                  </div>
                )}
                {specRows.map((row) => (
                  <div
                    key={`${row.label}-${row.variantName ?? "default"}`}
                    className="rounded-xl bg-lavender px-5 py-4"
                  >
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                      {row.label}
                      {row.variantName ? ` – ${row.variantName}` : ""}
                    </dt>
                    <dd className="mt-1 text-purple-950">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="rounded-[1.25rem] bg-lavender p-8">
            <h3 className="text-2xl font-light text-purple-950">
              Máte zájem o {vehicle.name}?
            </h3>
            <p className="mt-3 leading-7 text-purple-950/70">
              Napište nám a specialista vás bude kontaktovat. Zajistíme
              zkušební jízdu a připravíme osobní nabídku.
            </p>
            <div className="mt-6 rounded-xl bg-white p-5">
              <p className="font-bold text-purple-950">
                {companyInfo.contactPerson}
              </p>
              <p className="mt-1 text-sm text-purple-950/65">
                Specialista prodeje
              </p>
              <a
                href={`tel:${companyInfo.phone.replace(/\s/g, "")}`}
                className="mt-3 inline-block font-bold text-blue-700 hover:underline"
              >
                {companyInfo.phone}
              </a>
            </div>
            <ButtonLink href="/kontakt" variant="blue" className="mt-6">
              Nezávazná poptávka
            </ButtonLink>
          </div>
        </Container>
      </section>

      <PurchaseProcess />

      <section className="site-section bg-lavender">
        <Container className="max-w-3xl">
          <h2 className="text-center text-3xl font-light text-purple-950">
            Nezávazná poptávka vozu
          </h2>
          <div className="mt-8">
            <InquiryForm variant="inquiry" vehicleName={vehicle.name} />
          </div>
        </Container>
      </section>

      <RelatedVehicles vehicles={related} />

      <CtaSection
        title={`Chcete se zeptat na ${vehicle.name}?`}
        description="AI poradce vám pomůže s orientací. Závaznou nabídku vždy potvrdí specialista."
      />
    </>
  );
}
