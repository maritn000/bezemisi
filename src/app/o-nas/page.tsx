import type { Metadata } from "next";

import { EditorialPage } from "@/components/site/editorial-page";
import { editorialPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "O nás",
  description: "Jak Bez emisí přistupuje k výběru elektromobilu a poradenství.",
};

export default function AboutPage() {
  return <EditorialPage page={editorialPages["o-nas"]} />;
}
