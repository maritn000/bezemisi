import { ButtonLink } from "./button";
import { Container } from "./container";

export function CtaSection({
  title = "Potřebujete se zorientovat?",
  description = "AI poradce vám pomůže ujasnit požadavky. Závaznou cenu a dostupnost vždy potvrdí osobní kontakt.",
  href = "/chat",
  label = "Zeptat se AI poradce",
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="bg-purple-950 text-white">
      <Container className="grid gap-8 py-14 md:grid-cols-[1fr_auto] md:items-center lg:py-20">
        <div>
          <h2 className="text-3xl font-light sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-white/70">
            {description}
          </p>
        </div>
        <ButtonLink href={href} variant="green">
          {label}
        </ButtonLink>
      </Container>
    </section>
  );
}
