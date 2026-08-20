#!/usr/bin/env bash
set -euo pipefail

webhook_event="${CODEBUILD_WEBHOOK_EVENT:-}"
webhook_head_ref="${CODEBUILD_WEBHOOK_HEAD_REF:-}"

if [[ "${webhook_event}" == "PUSH" && "${webhook_head_ref}" == "refs/heads/main" ]]; then
  echo "Authorized production frontend release from a push to main."
elif [[ "${ALLOW_MANUAL_PRODUCTION_DEPLOY:-false}" == "true" && "${CODEBUILD_SOURCE_VERSION:-}" == "refs/heads/main" ]]; then
  echo "Authorized explicitly requested manual frontend release from main."
else
  echo "Refusing frontend production release outside a push to refs/heads/main." >&2
  echo "For a deliberate manual main rebuild, set ALLOW_MANUAL_PRODUCTION_DEPLOY=true for that build." >&2
  exit 1
fi
