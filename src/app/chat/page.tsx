import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatInterface } from "@/components/chat/chat-interface";

export const metadata: Metadata = {
  title: "AI poradce",
  description:
    "AI poradce pro elektromobily prezentované Bez emisí, nabíjení a cestu k nabídce.",
};

export default function ChatPage() {
  return (
    <section className="bg-lavender py-10 sm:py-16">
      <div className="site-container">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="font-bold uppercase tracking-[0.15em] text-blue-700">
            Bez emisí AI
          </p>
          <h1 className="mt-3 text-4xl font-light tracking-[-0.03em] text-purple-950 sm:text-5xl">
            Ptejte se na elektromobily
          </h1>
          <p className="mt-4 text-lg leading-8 text-purple-950/70">
            Poradce se drží vozů a služeb Bez emisí. V této fázi nemá připojená
            ověřená katalogová data a konkrétní údaje nebude doplňovat z
            paměti.
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
          <Suspense
            fallback={
              <div className="min-h-[36rem] animate-pulse rounded-[1.5rem] bg-white" />
            }
          >
            <ChatInterface />
          </Suspense>
          <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-6 text-purple-950/65">
            AI poradce odpovídá pouze k vozům a službám Bez emisí. Parametry,
            ceny a dostupnost se mohou měnit; rozhodující je vždy potvrzení
            konkrétní nabídky.
          </p>
        </div>
      </div>
    </section>
  );
}
