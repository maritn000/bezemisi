import { ButtonLink } from "@/components/site/button";
import { Container } from "@/components/site/container";

export default function NotFound() {
  return (
    <section className="site-section bg-lavender">
      <Container className="max-w-3xl text-center">
        <p className="font-bold uppercase tracking-[0.15em] text-blue-700">
          404
        </p>
        <h1 className="mt-3 text-4xl font-light text-purple-950 sm:text-5xl">
          Stránka nebyla nalezena
        </h1>
        <p className="mt-4 text-lg leading-8 text-purple-950/70">
          Odkaz může být zastaralý nebo stránka již není dostupná.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="blue">
            Zpět na úvod
          </ButtonLink>
          <ButtonLink href="/elektromobily" variant="outline">
            Elektromobily
          </ButtonLink>
          <ButtonLink href="/chat" variant="green">
            AI poradce
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
