import type { Metadata } from "next";

import { EditorialPage } from "@/components/site/editorial-page";
import { editorialPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Jak vybrat elektromobil",
  description: "Praktický začátek výběru elektromobilu podle vašich potřeb.",
};

export default function SelectionGuidePage() {
  return <EditorialPage page={editorialPages["jak-vybrat"]} />;
}
