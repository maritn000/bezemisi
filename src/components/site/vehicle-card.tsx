import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "./button";

export function VehicleCard({
  name,
  category,
  href = "/chat",
}: {
  name: string;
  category: string;
  href?: string;
}) {
  return (
    <article className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-purple-950/8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(31,5,86,.08)]">
      <Link href={href} className="block focus-visible:outline-none">
        <Image
          src="/ev-placeholder.svg"
          alt=""
          width={960}
          height={540}
          unoptimized
          className="aspect-video w-full object-cover"
        />
      </Link>
      <div className="p-6">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-blue-700">
          {category}
        </p>
        <h3 className="mt-2 text-3xl font-light text-purple-950">
          <Link
            href={href}
            className="rounded-sm hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {name}
          </Link>
        </h3>
        <p className="mt-4 min-h-14 leading-7 text-purple-950/70">
          Ověřené parametry, cena a dostupnost budou doplněny po připojení
          katalogu.
        </p>
        <ButtonLink href={href} variant="blue" className="mt-6 w-full">
          Více o modelu
        </ButtonLink>
      </div>
    </article>
  );
}
