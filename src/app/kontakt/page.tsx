import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/site/section-heading";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Možnosti kontaktu s Bez emisí v produktovém prototypu.",
};

export default function ContactPage() {
  return (
    <section className="site-section bg-lavender">
      <div className="site-container grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Kontakt"
          title="Pojďme probrat váš další elektromobil"
          description="V této prototypové verzi formuláře neodesílají ani neukládají osobní údaje. Pro aktuální kontakt použijte produkční web Bez emisí."
        />
        <div className="rounded-[1.25rem] bg-white p-7 ring-1 ring-purple-950/8 sm:p-9">
          <h2 className="text-2xl font-light">Jak chcete pokračovat?</h2>
          <div className="mt-6 grid gap-4">
            <Link href="/chat" className="button button-blue">
              Nejdřív se zeptat AI poradce
            </Link>
            <a
              href="https://www.bezemisi.cz/kontakt"
              rel="noreferrer"
              target="_blank"
              className="button button-outline text-center"
            >
              Otevřít produkční kontakt
              <span className="sr-only"> v novém okně</span>
            </a>
          </div>
          <p className="mt-6 rounded-xl bg-lavender p-4 text-sm leading-6 text-purple-950/70">
            Prototyp nepřijímá objednávky, poptávky ani závazné žádosti. Na
            produkčním webu si vždy ověřte, komu údaje odesíláte.
          </p>
        </div>
      </div>
    </section>
  );
}
