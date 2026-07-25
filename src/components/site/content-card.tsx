import Image from "next/image";
import Link from "next/link";

export function ContentCard({
  title,
  description,
  href,
  image,
  imageAlt,
  cta = "Více",
}: {
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  cta?: string;
}) {
  return (
    <article className="group overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-purple-950/8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(31,5,86,.08)]">
      <Link href={href} className="block focus-visible:outline-none">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-light text-purple-950">{title}</h3>
          <p className="mt-2 leading-7 text-purple-950/70">{description}</p>
          <span className="mt-4 inline-flex items-center gap-2 font-bold text-blue-700">
            {cta}
            <span aria-hidden="true" className="transition group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}
