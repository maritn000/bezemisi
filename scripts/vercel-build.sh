#!/usr/bin/env bash
set -euo pipefail

if [ "${RUN_CATALOGUE_BOOTSTRAP:-}" = "true" ]; then
  echo "RUN_CATALOGUE_BOOTSTRAP=true — running one-time catalogue bootstrap before build."
  npm run catalogue:bootstrap
else
  echo "Catalogue bootstrap skipped (set RUN_CATALOGUE_BOOTSTRAP=true for one-time bootstrap)."
fi

npm run build
