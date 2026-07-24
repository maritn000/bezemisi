import "server-only";

import { getNormalizedDatabaseUrl } from "@/env";

import { createDb } from "./create-client";

export const db = createDb(getNormalizedDatabaseUrl());
