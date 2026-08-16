#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
release_script="${script_dir}/release-frontend.sh"
authorization_script="${script_dir}/authorize-frontend-release.sh"

bash -n "${release_script}"
bash -n "${authorization_script}"

if env \
  -u CODEBUILD_WEBHOOK_EVENT \
  -u CODEBUILD_WEBHOOK_HEAD_REF \
  -u CODEBUILD_SOURCE_VERSION \
  -u ALLOW_MANUAL_PRODUCTION_DEPLOY \
  "${authorization_script}" >/dev/null 2>&1; then
  echo "Release authorization accepted a build without a trusted main trigger." >&2
  exit 1
fi

env \
  CODEBUILD_WEBHOOK_EVENT=PUSH \
  CODEBUILD_WEBHOOK_HEAD_REF=refs/heads/main \
  "${authorization_script}" >/dev/null

env \
  -u CODEBUILD_WEBHOOK_EVENT \
  -u CODEBUILD_WEBHOOK_HEAD_REF \
  ALLOW_MANUAL_PRODUCTION_DEPLOY=true \
  CODEBUILD_SOURCE_VERSION=refs/heads/main \
  "${authorization_script}" >/dev/null

echo "Frontend release authorization tests passed."
