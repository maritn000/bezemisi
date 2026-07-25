import "server-only";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collapseDuplicateBrandPrefix(title: string, brandName: string) {
  const trimmedBrand = brandName.trim();
  if (!trimmedBrand) return title;

  const pattern = new RegExp(
    `^(${escapeRegExp(trimmedBrand)}\\s+)+`,
    "i",
  );
  return title.replace(pattern, `${trimmedBrand} `).trim();
}

export function normalizeVehicleTitle(
  brandName: string,
  modelName: string,
  title?: string | null,
) {
  const brand = brandName.trim();
  const model = modelName.trim();
  const canonical = `${brand} ${model}`.replace(/\s+/g, " ").trim();

  if (!title?.trim()) {
    return canonical;
  }

  const cleaned = title.trim().replace(/\s+/g, " ");
  const withoutBrandDupes = collapseDuplicateBrandPrefix(cleaned, brand);
  const canonicalLower = canonical.toLowerCase();
  const cleanedLower = withoutBrandDupes.toLowerCase();

  if (cleanedLower === canonicalLower) {
    return canonical;
  }

  if (cleanedLower.startsWith(`${canonicalLower} `)) {
    return withoutBrandDupes;
  }

  if (
    cleanedLower.startsWith(`${brand.toLowerCase()} `) &&
    !cleanedLower.startsWith(`${canonicalLower}`)
  ) {
    return withoutBrandDupes;
  }

  if (!cleanedLower.includes(brand.toLowerCase())) {
    return canonical;
  }

  return withoutBrandDupes;
}
