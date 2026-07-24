import type { Metadata } from "next";

import { EditorialPage } from "@/components/site/editorial-page";

export const metadata: Metadata = {
  title: "Operativní leasing",
  description:
    "Základní orientace v operativním leasingu elektromobilů Bez emisí.",
};

export default function OperationalLeasePage() {
  return (
    <EditorialPage
      page={{
        eyebrow: "Operativní leasing",
        title: "Elektromobil bez starostí s vlastnictvím",
        description:
          "Princip služby představujeme bez neověřených splátek a obchodních podmínek.",
        introTitle: "Porovnávejte celý rozsah služby",
        intro:
          "Měsíční platba sama nestačí. Důležitá je délka smlouvy, nájezd, zahrnuté služby, pojištění i podmínky vrácení.",
        cards: [
          {
            title: "Rozsah služby",
            text: "Ověřte, co splátka skutečně obsahuje a které náklady zůstávají na vás.",
          },
          {
            title: "Nájezd a doba",
            text: "Podmínky musí odpovídat vašemu reálnému používání vozu.",
          },
          {
            title: "Závazná kalkulace",
            text: "Konkrétní částku a dostupnost musí potvrdit aktuální obchodní nabídka.",
          },
        ],
      }}
    />
  );
}
