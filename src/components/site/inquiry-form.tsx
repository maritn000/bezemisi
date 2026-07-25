"use client";

import { FormEvent, useState } from "react";

import { Button } from "./button";

type InquiryFormProps = {
  variant?: "contact" | "newsletter" | "inquiry";
  vehicleName?: string;
};

export function InquiryForm({
  variant = "contact",
  vehicleName,
}: InquiryFormProps) {
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(
      "Odeslání formuláře je dočasně nedostupné. Kontaktujte nás telefonicky nebo přes AI poradce.",
    );
  }

  if (variant === "newsletter") {
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
          Odeslat
        </Button>
        {message && (
          <p role="status" className="basis-full text-sm text-purple-950/70">
            {message}
          </p>
        )}
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.25rem] bg-white p-7 ring-1 ring-purple-950/8 sm:p-9"
      noValidate
    >
      <h2 className="text-2xl font-light">
        {variant === "inquiry" ? "Nezávazná poptávka" : "Napište nám"}
      </h2>
      {vehicleName && (
        <p className="mt-2 text-sm text-purple-950/65">
          Zájem o model: <strong>{vehicleName}</strong>
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inquiry-firstname" className="mb-2 block text-sm font-semibold">
            Jméno
          </label>
          <input
            id="inquiry-firstname"
            name="firstname"
            type="text"
            autoComplete="given-name"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div>
          <label htmlFor="inquiry-lastname" className="mb-2 block text-sm font-semibold">
            Příjmení
          </label>
          <input
            id="inquiry-lastname"
            name="lastname"
            type="text"
            autoComplete="family-name"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div>
          <label htmlFor="inquiry-email" className="mb-2 block text-sm font-semibold">
            E-mail
          </label>
          <input
            id="inquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div>
          <label htmlFor="inquiry-phone" className="mb-2 block text-sm font-semibold">
            Telefon
          </label>
          <input
            id="inquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="inquiry-zip" className="mb-2 block text-sm font-semibold">
            PSČ
          </label>
          <input
            id="inquiry-zip"
            name="zip"
            type="text"
            autoComplete="postal-code"
            className="w-full rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="inquiry-message" className="mb-2 block text-sm font-semibold">
            Vaše zpráva
          </label>
          <textarea
            id="inquiry-message"
            name="message"
            rows={4}
            className="w-full resize-y rounded-xl border border-purple-950/15 px-4 py-3 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15"
          />
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-purple-950/55">
        Odesláním tohoto formuláře souhlasíte se zpracováním osobních údajů.
      </p>

      <Button type="submit" variant="blue" className="mt-6">
        Odeslat
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
