import Image from "next/image";
import Link from "next/link";

export function Hero({
  eyebrow,
  title,
  description,
  primary = { href: "/chat", label: "Zeptat se AI poradce" },
  secondary,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="overflow-hidden bg-lavender">
      <div className="site-container grid min-h-[33rem] items-center gap-8 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
        <div className="relative z-10">
          {eyebrow && (
            <p className="mb-4 font-bold uppercase tracking-[0.15em] text-blue-700">
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-3xl text-5xl font-light leading-[1.03] tracking-[-0.035em] text-purple-950 sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-purple-950/75 sm:text-xl">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primary.href} className="button button-blue">
              {primary.label}
            </Link>
            {secondary && (
              <Link href={secondary.href} className="button button-outline">
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute -inset-10 rounded-full bg-green-400/35 blur-3xl" />
          <Image
            src="/ev-placeholder.svg"
            alt="Ilustrační silueta elektromobilu"
            width={960}
            height={540}
            priority
            className="relative h-auto w-full rounded-[2rem]"
          />
        </div>
      </div>
    </section>
  );
}
