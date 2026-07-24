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
import {
  companyInfo,
  findPresentedVehicle,
  getRelatedVehicles,
} from "@/lib/site-content";

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
    description: vehicle.tagline,
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

  const related = getRelatedVehicles(brand, model);

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
                {vehicle.category}
              </p>
              <h1 className="mt-3 text-5xl font-light tracking-[-0.03em] text-purple-950 sm:text-6xl">
                {vehicle.name}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-950/70">
                {vehicle.tagline}
              </p>
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
            <VehicleHeroImage vehicle={vehicle} />
          </div>
        </Container>
      </section>

      <section className="site-section bg-white">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-light text-purple-950">
              O modelu {vehicle.name}
            </h2>
            <p className="mt-4 leading-7 text-purple-950/70">
              {vehicle.tagline} Pro konkrétní parametry, cenu a dostupnost nás
              kontaktujte — připravíme nabídku na míru.
            </p>
            <dl className="mt-8 space-y-4">
              <div className="rounded-xl bg-lavender px-5 py-4">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  Kategorie
                </dt>
                <dd className="mt-1 text-purple-950">{vehicle.category}</dd>
              </div>
              <div className="rounded-xl bg-lavender px-5 py-4">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  Značka
                </dt>
                <dd className="mt-1 capitalize text-purple-950">
                  {vehicle.brand}
                </dd>
              </div>
            </dl>
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
