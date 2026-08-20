#!/usr/bin/env bash
set -euo pipefail

aws_region="${AWS_REGION:-us-east-1}"
aws_account_id="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
ecr_repository="${ECR_REPOSITORY:?ECR_REPOSITORY is required}"
source_revision="${GIT_COMMIT:-}"
application_health_url="${APPLICATION_HEALTH_URL:-https://infraudit.com/}"
frontend_build_secret_id="${FRONTEND_BUILD_SECRET_ID:-infraudit/production/frontend-build}"
github_token="${GITHUB_TOKEN:?GITHUB_TOKEN is required to verify the current main revision}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${script_dir}/authorize-frontend-release.sh"

if [[ ! "${source_revision}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Refusing to release without an exact 40-character Git commit SHA." >&2
  exit 1
fi

caller_account="$(aws sts get-caller-identity --query Account --output text)"
caller_arn="$(aws sts get-caller-identity --query Arn --output text)"
if [[ "${caller_account}" != "${aws_account_id}" || "${caller_arn}" == *":root" ]]; then
  echo "Refusing deployment from unexpected AWS identity ${caller_arn}." >&2
  exit 1
fi

checkout_revision="$(git rev-parse HEAD)"
if [[ "${checkout_revision}" != "${source_revision}" ]]; then
  echo "Refusing to deploy ${source_revision}; the checked-out revision is ${checkout_revision}." >&2
  exit 1
fi

main_revision="$(curl --fail --silent --show-error \
  --header "Authorization: Bearer ${github_token}" \
  --header "Accept: application/vnd.github+json" \
  https://api.github.com/repos/pratik-mahalle/InfraAudit/git/ref/heads/main |
  jq -r '.object.sha')"
if [[ "${main_revision}" != "${source_revision}" ]]; then
  echo "Refusing to deploy ${source_revision}; current GitHub main is ${main_revision}." >&2
  exit 1
fi

frontend_build_secret="$(aws secretsmanager get-secret-value \
  --secret-id "${frontend_build_secret_id}" \
  --region "${aws_region}" \
  --query SecretString \
  --output text)"
vite_supabase_url="$(jq -er '.VITE_SUPABASE_URL | strings | select(length > 0)' <<<"${frontend_build_secret}")"
vite_supabase_anon_key="$(jq -er '.VITE_SUPABASE_ANON_KEY | strings | select(length > 0)' <<<"${frontend_build_secret}")"
unset frontend_build_secret

registry="${aws_account_id}.dkr.ecr.${aws_region}.amazonaws.com"
tagged_image="${registry}/${ecr_repository}:${source_revision}"

aws ecr get-login-password --region "${aws_region}" |
  docker login --username AWS --password-stdin "${registry}"

docker build \
  --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL= \
  --build-arg VITE_OAUTH_BACKEND_BASE= \
  --build-arg VITE_SUPABASE_URL="${vite_supabase_url}" \
  --build-arg SUPABASE_PUBLIC_KEY="${vite_supabase_anon_key}" \
  --tag "${tagged_image}" \
  .
unset vite_supabase_url vite_supabase_anon_key

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

# Terraform resolves this stable alias to an immutable digest. Move it only
# after ECS and the public application health check confirm the release.
production_image="${registry}/${ecr_repository}:production"
docker tag "${tagged_image}" "${production_image}"
docker push "${production_image}"

production_digest="$(aws ecr describe-images \
  --repository-name "${ecr_repository}" \
  --image-ids imageTag=production \
  --region "${aws_region}" \
  --query 'imageDetails[0].imageDigest' \
  --output text)"
if [[ "${production_digest}" != "${image_digest}" ]]; then
  echo "The frontend production alias does not match the deployed digest." >&2
  exit 1
fi

echo "Production frontend is healthy at ${image_uri}."
