"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="site-container grid min-h-[50vh] place-items-center py-20 text-center">
      <div>
        <p className="font-bold uppercase tracking-wider text-blue-700">
          Něco se nepovedlo
        </p>
        <h1 className="mt-3 text-4xl font-light text-purple-950">
          Stránku se nepodařilo načíst
        </h1>
        <p className="mt-4 text-purple-950/70">
          Zkuste požadavek zopakovat. Žádná data nebyla odeslána.
        </p>
        <button
          type="button"
          onClick={reset}
          className="button button-blue mt-7"
        >
          Zkusit znovu
        </button>
      </div>
    </section>
  );
}
