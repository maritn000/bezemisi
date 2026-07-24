import { NextResponse } from "next/server";

import {
  isCatalogueAdminAuthorized,
  isCatalogueAdminConfigured,
} from "@/lib/catalogue/admin-auth";
import { getCatalogueStatusSnapshot } from "@/lib/catalogue/catalogue-health";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCatalogueAdminConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isCatalogueAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getCatalogueStatusSnapshot();
  return NextResponse.json(snapshot);
}
