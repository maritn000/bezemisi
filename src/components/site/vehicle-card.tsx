import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "./button";

export function VehicleCard({
  name,
  category,
  href = "/elektromobily",
  image = "/ev-placeholder.svg",
  imageAlt,
  tagline,
}: {
  name: string;
  category: string;
  href?: string;
  image?: string;
  imageAlt?: string;
  tagline?: string;
}) {
  const alt = imageAlt ?? name;

  return (
    <article className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-purple-950/8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(31,5,86,.08)]">
      <Link href={href} className="block focus-visible:outline-none">
        <div className="relative aspect-video overflow-hidden bg-lavender">
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
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
        {tagline && (
          <p className="mt-4 min-h-14 line-clamp-2 leading-7 text-purple-950/70">
            {tagline}
          </p>
        )}
        <ButtonLink href={href} variant="blue" className="mt-6 w-full">
          Více o modelu
        </ButtonLink>
      </div>
    </article>
  );
}
