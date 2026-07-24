import Image from "next/image";

import { ButtonLink } from "./button";
import { Container } from "./container";

export function Hero({
  eyebrow,
  title,
  description,
  primary = { href: "/elektromobily", label: "Objevte nabídku" },
  secondary,
  image = "/hero/home-hero.png",
  imageAlt = "Elektromobil Bez emisí",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  image?: string;
  imageAlt?: string;
  dark?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden ${dark ? "bg-purple-950 text-white" : "bg-lavender"}`}
    >
      <Container className="grid min-h-[28rem] items-center gap-8 py-12 lg:min-h-[33rem] lg:grid-cols-[1.05fr_.95fr] lg:py-16">
        <div className="relative z-10 animate-[fade-up_.7s_ease_both]">
          {eyebrow && (
            <p
              className={`mb-4 font-bold uppercase tracking-[0.15em] ${dark ? "text-green-400" : "text-blue-700"}`}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className={`max-w-3xl text-5xl font-light leading-[1.03] tracking-[-0.035em] sm:text-6xl lg:text-7xl ${dark ? "text-white" : "text-purple-950"}`}
          >
            {title}
          </h1>
          {description && (
            <p
              className={`mt-6 max-w-2xl text-lg leading-8 sm:text-xl ${dark ? "text-white/75" : "text-purple-950/75"}`}
            >
              {description}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={primary.href} variant="blue">
              {primary.label}
            </ButtonLink>
            {secondary && (
              <ButtonLink
                href={secondary.href}
                variant={dark ? "green" : "outline"}
              >
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl animate-[fade-in_.9s_ease_.1s_both]">
          {!dark && (
            <div className="absolute -inset-10 rounded-full bg-green-400/35 blur-3xl" />
          )}
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem]">
            <Image
              src={image}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
