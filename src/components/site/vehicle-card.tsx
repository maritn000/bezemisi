import Image from "next/image";
import Link from "next/link";

export function VehicleCard({
  name,
  category,
}: {
  name: string;
  category: string;
}) {
  return (
    <article className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-purple-950/8">
      <Image
        src="/ev-placeholder.svg"
        alt=""
        width={960}
        height={540}
        unoptimized
        className="aspect-video w-full object-cover"
      />
      <div className="p-6">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-blue-700">
          {category}
        </p>
        <h3 className="mt-2 text-3xl font-light text-purple-950">{name}</h3>
        <p className="mt-4 min-h-14 leading-7 text-purple-950/70">
          Ověřené parametry, cena a dostupnost budou doplněny po připojení
          katalogu.
        </p>
        <Link
          href="/chat"
          className="button button-blue mt-6 flex w-full justify-center"
        >
          Zeptat se na vůz
        </Link>
      </div>
    </article>
  );
}
