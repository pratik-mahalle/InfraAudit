#!/usr/bin/env bash
set -euo pipefail

node_image="public.ecr.aws/docker/library/node:20-bookworm"

# Validation does not require production credentials. These non-production
# public placeholders let Vite compile the authentication client without
# exposing AWS credentials or the production build configuration to PR jobs.
vite_supabase_url="${VITE_SUPABASE_URL:-https://placeholder.supabase.co}"
vite_supabase_anon_key="${VITE_SUPABASE_ANON_KEY:-placeholder-public-anon-key}"

docker run --rm \
  --env HOME=/tmp \
  --env VITE_API_BASE_URL= \
  --env VITE_OAUTH_BACKEND_BASE= \
  --env "VITE_SUPABASE_URL=${vite_supabase_url}" \
  --env "VITE_SUPABASE_ANON_KEY=${vite_supabase_anon_key}" \
  --user "$(id -u):$(id -g)" \
  --volume "${PWD}:/workspace" \
  --workdir /workspace \
  "${node_image}" \
  bash -ec '
    npm ci
    npm run check
    npm run build
    bash deploy/deploy-frontend_test.sh
    bash infra/jenkins/release-frontend_test.sh

    test -f dist/public/index.html
    compgen -G "dist/public/assets/index-*.js" >/dev/null
  '

echo "Frontend validation passed."
