import type { Metadata } from "next";

import { EditorialPage } from "@/components/site/editorial-page";
import { editorialPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Akční nabídky",
  description:
    "Místo pro ověřené akční nabídky elektromobilů Bez emisí.",
};

export default function OffersPage() {
  return <EditorialPage page={editorialPages["akcni-nabidky"]} />;
}
