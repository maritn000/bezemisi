export function isCatalogueAdminConfigured(): boolean {
  return Boolean(process.env.CATALOGUE_ADMIN_TOKEN);
}

export function isCatalogueAdminAuthorized(request: Request): boolean {
  const token = process.env.CATALOGUE_ADMIN_TOKEN;
  if (!token) {
    return false;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${token}`;
}
