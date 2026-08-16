#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
release_script="${script_dir}/release-frontend.sh"

bash -n "${release_script}"

if env \
  AWS_ACCOUNT_ID=007761758041 \
  AWS_REGION=us-east-1 \
  ECR_REPOSITORY=infraudit-production-frontend \
  CODEBUILD_RESOLVED_SOURCE_VERSION=0123456789012345678901234567890123456789 \
  VITE_SUPABASE_URL=https://example.supabase.co \
  VITE_SUPABASE_ANON_KEY=public-test-value \
  "${release_script}" >/dev/null 2>&1; then
  echo "Release script accepted a build that was not authorized from main." >&2
  exit 1
fi

echo "Frontend release authorization tests passed."
