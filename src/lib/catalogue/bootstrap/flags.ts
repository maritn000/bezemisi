export function isCatalogueBootstrapEnabled(
  value: string | undefined = process.env.RUN_CATALOGUE_BOOTSTRAP,
): boolean {
  return value === "true";
}
