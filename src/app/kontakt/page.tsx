import type { Metadata } from "next";

import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { PrototypeContactForm } from "@/components/site/prototype-form";
import { SectionHeading } from "@/components/site/section-heading";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Možnosti kontaktu s Bez emisí v produktovém prototypu.",
};

export default function ContactPage() {
  return (
    <section className="site-section bg-lavender">
      <Container className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Kontakt"
            title="Pojďme probrat váš další elektromobil"
            description="V této prototypové verzi formuláře neodesílají ani neukládají osobní údaje. Pro aktuální kontakt použijte produkční web Bez emisí."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/chat" variant="blue">
              Nejdřív se zeptat AI poradce
            </ButtonLink>
            <ButtonLink href="/" variant="outline">
              Zpět na úvod
            </ButtonLink>
          </div>
          <p className="mt-6 rounded-xl bg-white/70 p-4 text-sm leading-6 text-purple-950/70">
            Prototyp nepřijímá objednávky, poptávky ani závazné žádosti a
            nenahrazuje produkční web bezemisi.cz.
          </p>
        </div>
        <PrototypeContactForm />
      </Container>
    </section>
  );
}
