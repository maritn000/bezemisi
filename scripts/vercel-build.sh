#!/usr/bin/env bash
set -euo pipefail

if [ "${RUN_CATALOGUE_BOOTSTRAP:-}" = "true" ]; then
  echo "RUN_CATALOGUE_BOOTSTRAP=true — running one-time catalogue bootstrap before build."
  npm run catalogue:bootstrap
else
  echo "Catalogue bootstrap skipped (set RUN_CATALOGUE_BOOTSTRAP=true for one-time bootstrap)."
fi

if [ -n "${DATABASE_URL:-}${POSTGRES_URL:-}" ]; then
  echo "Running idempotent verified range repair before build."
  npm run catalogue:repair-range
else
  echo "Range repair skipped (database URL not configured)."
fi

npm run build
