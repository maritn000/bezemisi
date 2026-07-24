export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-8">
        <div className="w-full max-w-2xl">
          <span className="mb-8 inline-block rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            Projekt se připravuje
          </span>

          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Bez emisí AI
          </h1>

          <p className="mt-4 text-xl text-zinc-600">
            Nezávislý průvodce světem elektromobility
          </p>

          <p className="mt-8 max-w-xl text-base leading-7 text-zinc-700">
            Připravujeme AI asistenta, který vám pomůže orientovat se v
            elektromobilech, nabíjení, provozních nákladech a každodenním
            používání. Brzy zde najdete praktické odpovědi bez zbytečného
            marketingového balastu.
          </p>
        </div>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-6 sm:px-8">
        <p className="text-sm text-zinc-500">Bez emisí</p>
      </footer>
    </div>
  );
}
