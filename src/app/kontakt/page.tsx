import type { Metadata } from "next";

import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { InquiryForm } from "@/components/site/inquiry-form";
import { SectionHeading } from "@/components/site/section-heading";
import { companyInfo } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktujte Bez emisí — specializovaného prodejce elektromobilů.",
};

export default function ContactPage() {
  return (
    <section className="site-section bg-lavender">
      <Container className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="Kontakt"
            title="Pojďme probrat váš další elektromobil"
            description="Jsme tu pro vás. Napište nám nebo volejte — specialista vás bude kontaktovat."
          />
          <div className="mt-8 space-y-4 rounded-[1.25rem] bg-white p-6 ring-1 ring-purple-950/8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                Specialista prodeje
              </p>
              <p className="mt-1 text-xl font-medium text-purple-950">
                {companyInfo.contactPerson}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                Telefon
              </p>
              <a
                href={`tel:${companyInfo.phone.replace(/\s/g, "")}`}
                className="mt-1 inline-block text-xl font-medium text-blue-700 hover:underline"
              >
                {companyInfo.phone}
              </a>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                Sídlo
              </p>
              <p className="mt-1 leading-7 text-purple-950/80">
                {companyInfo.name}
                <br />
                {companyInfo.address}
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/chat" variant="blue">
              Zeptat se AI poradce
            </ButtonLink>
            <ButtonLink href="/elektromobily" variant="outline">
              Prohlédnout vozy
            </ButtonLink>
          </div>
        </div>
        <InquiryForm variant="contact" />
      </Container>
    </section>
  );
}
