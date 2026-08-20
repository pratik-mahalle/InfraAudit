#!/usr/bin/env bash
set -euo pipefail

if [[ "${BRANCH_NAME:-}" == "main" && -z "${CHANGE_ID:-}" ]]; then
  echo "Authorized production frontend release from the Jenkins main branch job."
else
  echo "Refusing frontend production release outside the non-PR main branch job." >&2
  exit 1
fi
