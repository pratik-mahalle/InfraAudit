#!/usr/bin/env bash
set -euo pipefail

validation_mode="${1:-}"
if [[ "${validation_mode}" != "pull-request" && "${validation_mode}" != "main" ]]; then
  echo "Usage: $0 <pull-request|main>" >&2
  exit 2
fi

: "${VITE_SUPABASE_URL:?VITE_SUPABASE_URL is required}"
: "${VITE_SUPABASE_ANON_KEY:?VITE_SUPABASE_ANON_KEY is required}"

# Production uses same-origin API routes through the ALB. Explicit empty values
# prevent the Dockerfile defaults from pointing browsers at a separate host.
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"
export VITE_OAUTH_BACKEND_BASE="${VITE_OAUTH_BACKEND_BASE:-}"

npm ci
npm run check
npm run build
bash deploy/deploy-frontend_test.sh
bash infra/codebuild/release-frontend_test.sh

if [[ ! -f dist/public/index.html ]]; then
  echo "Frontend build did not produce dist/public/index.html." >&2
  exit 1
fi

if ! compgen -G 'dist/public/assets/index-*.js' >/dev/null; then
  echo "Frontend build did not produce an application JavaScript bundle." >&2
  exit 1
fi

echo "Frontend ${validation_mode} validation passed."
