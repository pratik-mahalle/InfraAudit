#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
release_script="${script_dir}/release-frontend.sh"
authorization_script="${script_dir}/authorize-frontend-release.sh"

bash -n "${release_script}"
bash -n "${authorization_script}"

if env -u BRANCH_NAME -u CHANGE_ID "${authorization_script}" >/dev/null 2>&1; then
  echo "Release authorization accepted a build without a trusted main branch." >&2
  exit 1
fi

env -u CHANGE_ID BRANCH_NAME=main "${authorization_script}" >/dev/null

if env BRANCH_NAME=feature CHANGE_ID= "${authorization_script}" >/dev/null 2>&1; then
  echo "Release authorization accepted a feature branch." >&2
  exit 1
fi

if env BRANCH_NAME=main CHANGE_ID=123 "${authorization_script}" >/dev/null 2>&1; then
  echo "Release authorization accepted a pull request." >&2
  exit 1
fi

echo "Frontend Jenkins release authorization tests passed."
