import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 rounded-sm font-semibold tracking-[-0.04em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${
        light ? "text-white" : "text-purple-950"
      }`}
      aria-label="Bez emisí – úvodní stránka"
    >
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-full bg-green-400 text-lg text-purple-950"
      >
        ↯
      </span>
      <span className="text-[1.65rem]">Bez emisí</span>
    </Link>
  );
}
