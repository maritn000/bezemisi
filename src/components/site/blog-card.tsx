import Image from "next/image";
import Link from "next/link";

export function BlogCard({
  title,
  date,
  excerpt,
  image,
  imageAlt,
  href = "/blog",
}: {
  title: string;
  date: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  href?: string;
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
          <time className="text-sm text-purple-950/55" dateTime={date}>
            {date}
          </time>
          <h3 className="mt-2 text-xl font-medium leading-snug text-purple-950">
            {title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-purple-950/70">
            {excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}
