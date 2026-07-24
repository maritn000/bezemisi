import type { Metadata } from "next";

import { EditorialPage } from "@/components/site/editorial-page";
import { editorialPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Praktická témata o výběru, nabíjení a používání elektromobilu.",
};

export default function BlogPage() {
  return <EditorialPage page={editorialPages.blog} />;
}
