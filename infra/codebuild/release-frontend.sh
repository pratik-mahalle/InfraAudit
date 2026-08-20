#!/usr/bin/env bash
set -euo pipefail

aws_region="${AWS_REGION:-us-east-1}"
aws_account_id="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
ecr_repository="${ECR_REPOSITORY:?ECR_REPOSITORY is required}"
source_revision="${CODEBUILD_RESOLVED_SOURCE_VERSION:-}"
application_health_url="${APPLICATION_HEALTH_URL:-https://infraudit.com/}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${script_dir}/authorize-frontend-release.sh"

if [[ ! "${source_revision}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Refusing to release without an exact 40-character Git commit SHA." >&2
  exit 1
fi

: "${VITE_SUPABASE_URL:?VITE_SUPABASE_URL is required}"
: "${VITE_SUPABASE_ANON_KEY:?VITE_SUPABASE_ANON_KEY is required}"

registry="${aws_account_id}.dkr.ecr.${aws_region}.amazonaws.com"
tagged_image="${registry}/${ecr_repository}:${source_revision}"

aws ecr get-login-password --region "${aws_region}" |
  docker login --username AWS --password-stdin "${registry}"

docker build \
  --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL= \
  --build-arg VITE_OAUTH_BACKEND_BASE= \
  --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  --build-arg SUPABASE_PUBLIC_KEY="${VITE_SUPABASE_ANON_KEY}" \
  --tag "${tagged_image}" \
  .
docker push "${tagged_image}"

image_digest="$(aws ecr describe-images \
  --repository-name "${ecr_repository}" \
  --image-ids "imageTag=${source_revision}" \
  --region "${aws_region}" \
  --query 'imageDetails[0].imageDigest' \
  --output text)"

if [[ ! "${image_digest}" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo "ECR did not return an immutable digest for ${tagged_image}." >&2
  exit 1
fi

image_uri="${registry}/${ecr_repository}@${image_digest}"
echo "Deploying immutable frontend image ${image_uri}"
./deploy/deploy-frontend.sh "${image_uri}"

curl --fail --show-error --silent --location \
  --retry 10 \
  --retry-delay 5 \
  --retry-all-errors \
  "${application_health_url}" \
  --output /dev/null

echo "Production frontend is healthy at ${image_uri}."
