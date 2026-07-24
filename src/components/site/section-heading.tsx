export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && (
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-light leading-tight text-purple-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-lg leading-8 text-purple-950/70">
          {description}
        </p>
      )}
    </div>
  );
}
