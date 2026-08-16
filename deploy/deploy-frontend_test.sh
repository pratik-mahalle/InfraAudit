#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
deploy_script="${script_dir}/deploy-frontend.sh"

bash -n "${deploy_script}"

for invalid_image in \
  "" \
  "infraudit-production-frontend:latest" \
  "007761758041.dkr.ecr.us-east-1.amazonaws.com/infraudit-production-frontend:mutable" \
  "007761758041.dkr.ecr.us-east-1.amazonaws.com/infraudit-production-frontend@sha256:abc"; do
  if "${deploy_script}" "${invalid_image}" >/dev/null 2>&1; then
    echo "Deployment script accepted invalid image: ${invalid_image}" >&2
    exit 1
  fi
done

echo "Frontend deployment guard tests passed."
