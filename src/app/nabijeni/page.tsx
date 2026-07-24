import type { Metadata } from "next";

import { EditorialPage } from "@/components/site/editorial-page";
import { editorialPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Nabíjení elektromobilu",
  description: "Základní orientace v domácím a veřejném nabíjení.",
};

export default function ChargingPage() {
  return <EditorialPage page={editorialPages.nabijeni} />;
}
