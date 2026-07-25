import Image from "next/image";

import type { PresentedVehicle } from "@/lib/site-content";

import { ButtonLink } from "./button";
import { VehicleGrid } from "./vehicle-grid";

export function RelatedVehicles({
  vehicles,
}: {
  vehicles: PresentedVehicle[];
}) {
  if (vehicles.length === 0) return null;

  return (
    <section className="site-section bg-white">
      <div className="site-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-bold uppercase tracking-[0.15em] text-blue-700">
              Další modely
            </p>
            <h2 className="mt-2 text-3xl font-light text-purple-950 sm:text-4xl">
              Mohlo by vás také zajímat
            </h2>
          </div>
          <ButtonLink href="/elektromobily" variant="outline">
            Přehled modelů
          </ButtonLink>
        </div>
        <VehicleGrid vehicles={vehicles} />
      </div>
    </section>
  );
}

export function PurchaseProcess() {
  const steps = [
    {
      number: "1",
      title: "Napíšete nám",
      text: "Popíšete své potřeby a preference.",
    },
    {
      number: "2",
      title: "Spojíme se a probereme možnosti",
      text: "Projdeme vhodné modely a varianty.",
    },
    {
      number: "3",
      title: "Zajistíme nabídku i zkušební jízdu",
      text: "Připravíme konkrétní nabídku podle vašich požadavků.",
    },
    {
      number: "4",
      title: "Předáme vůz",
      text: "Doprovodíme vás až k převzetí vozu.",
    },
  ];

  return (
    <section className="site-section bg-lavender">
      <div className="site-container">
        <div className="max-w-2xl">
          <p className="font-bold uppercase tracking-[0.15em] text-blue-700">
            Jak to probíhá
          </p>
          <h2 className="mt-2 text-3xl font-light text-purple-950 sm:text-4xl">
            Budeme s vámi během celého procesu
          </h2>
          <p className="mt-4 leading-7 text-purple-950/70">
            Specializujeme se na elektromobily. Poradíme s výběrem a pomůžeme s
            nákupem toho nejvhodnějšího přesně pro vás.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-[1.25rem] bg-white p-6 ring-1 ring-purple-950/8"
            >
              <span className="text-3xl font-light text-blue-700">
                {step.number}
              </span>
              <h3 className="mt-3 text-xl font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-purple-950/70">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VehicleHeroImage({
  vehicle,
}: {
  vehicle: { name: string; image: string; imageAlt: string };
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white p-4 ring-1 ring-purple-950/8">
      <div className="relative aspect-video overflow-hidden rounded-[1.1rem] bg-lavender">
        <Image
          src={vehicle.image}
          alt={vehicle.imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
