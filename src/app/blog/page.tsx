import type { Metadata } from "next";

import { BlogCard } from "@/components/site/blog-card";
import { Container } from "@/components/site/container";
import { CtaSection } from "@/components/site/cta-section";
import { Hero } from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { blogPosts, editorialPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Praktická témata o výběru, nabíjení a používání elektromobilu.",
};

export default function BlogPage() {
  const page = editorialPages.blog;

  return (
    <>
      <Hero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        secondary={{ href: "/chat", label: "Zeptat se AI poradce" }}
        image="/blog/nejlevnejsi-elektromobily.jpg"
        imageAlt="Články o elektromobilitě"
      />
      <section className="site-section bg-white">
        <Container>
          <SectionHeading title={page.introTitle} description={page.intro} />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {blogPosts.map((post) => (
              <BlogCard key={post.slug} {...post} />
            ))}
          </div>
        </Container>
      </section>
      <section className="site-section bg-lavender">
        <Container>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {page.cards.map((card, index) => (
              <article
                key={card.title}
                className="rounded-[1.25rem] bg-white p-7"
              >
                <span className="text-sm font-bold text-blue-700">
                  0{index + 1}
                </span>
                <h2 className="mt-4 text-2xl font-light text-purple-950">
                  {card.title}
                </h2>
                <p className="mt-3 leading-7 text-purple-950/70">{card.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <CtaSection />
    </>
  );
}
