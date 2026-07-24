"use client";

import { FormEvent, useState } from "react";

import { Button } from "./button";

export function PrototypeContactForm() {
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Toto je prototypový formulář. Údaje se nikam neodesílají a neukládají. Pro skutečný kontakt použijte produkční web Bez emisí.",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.25rem] bg-white p-7 ring-1 ring-purple-950/8 sm:p-9"
      noValidate
    >
      <h2 className="text-2xl font-light">Napište nám</h2>
      <p className="mt-2 text-sm leading-6 text-purple-950/65">
        Formulář je pouze vizuální ukázkou. Odeslání je záměrně vypnuté.
      </p>

      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold">
            Jméno a příjmení
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold">
            E-mail
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="mb-2 block text-sm font-semibold">
            Telefon
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold">
            Zpráva
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            className="w-full resize-y rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
      </div>

      <Button type="submit" variant="blue" className="mt-6">
        Odeslat (prototyp)
      </Button>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-lavender p-4 text-sm leading-6 text-purple-950/80"
        >
          {message}
        </p>
      )}
    </form>
  );
}

export function PrototypeNewsletterForm() {
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Odběr newsletteru je v tomto prototypu neaktivní. E-mail se nikam neodesílá.",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
      noValidate
    >
      <label htmlFor="newsletter-email" className="sr-only">
        E-mail pro newsletter
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="vas@email.cz"
        className="min-h-12 flex-1 rounded-xl border border-purple-950/15 px-4 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
      />
      <Button type="submit" variant="outline">
        Odebírat
      </Button>
      {message && (
        <p role="status" className="basis-full text-sm text-purple-950/70">
          {message}
        </p>
      )}
    </form>
  );
}
