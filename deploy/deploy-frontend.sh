#!/usr/bin/env bash
set -euo pipefail

image_uri="${1:-}"
aws_region="${AWS_REGION:-us-east-1}"
cluster="${ECS_CLUSTER:-infraudit-production}"
service="${ECS_SERVICE:-frontend}"

if [[ ! "${image_uri}" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$ ]]; then
  echo "Usage: $0 <ecr-image-uri@sha256:digest>" >&2
  echo "Refusing to deploy a mutable or non-ECR frontend image." >&2
  exit 2
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf -- "${tmp_dir}"' EXIT

source_definition="$(aws ecs describe-services \
  --cluster "${cluster}" \
  --services "${service}" \
  --region "${aws_region}" \
  --query 'services[0].taskDefinition' \
  --output text)"

if [[ ! "${source_definition}" =~ ^arn:aws(-[a-z0-9]+)*:ecs:[a-z0-9-]+:[0-9]{12}:task-definition/[A-Za-z0-9_-]+:[0-9]+$ ]]; then
  echo "Refusing to deploy without an exact source task definition ARN." >&2
  exit 1
fi

aws ecs describe-task-definition \
  --task-definition "${source_definition}" \
  --region "${aws_region}" \
  --query taskDefinition \
  --output json |
  jq --arg image "${image_uri}" '
    if ([.containerDefinitions[] | select(.name == "frontend")] | length) != 1 then
      error("expected exactly one frontend container")
    else
      del(
        .taskDefinitionArn,
        .revision,
        .status,
        .requiresAttributes,
        .compatibilities,
        .registeredAt,
        .registeredBy,
        .deregisteredAt
      )
      | (.containerDefinitions[] | select(.name == "frontend") | .image) = $image
    end
  ' >"${tmp_dir}/task-definition.json"

new_definition="$(aws ecs register-task-definition \
  --region "${aws_region}" \
  --cli-input-json "file://${tmp_dir}/task-definition.json" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"

echo "Deploying frontend ${new_definition}"
aws ecs update-service \
  --cluster "${cluster}" \
  --service "${service}" \
  --task-definition "${new_definition}" \
  --region "${aws_region}" \
  --query 'service.taskDefinition' \
  --output text

aws ecs wait services-stable \
  --cluster "${cluster}" \
  --services "${service}" \
  --region "${aws_region}"

read -r status desired running deployed_definition < <(
  aws ecs describe-services \
    --cluster "${cluster}" \
    --services "${service}" \
    --region "${aws_region}" \
    --query 'services[0].[status,desiredCount,runningCount,taskDefinition]' \
    --output text
)

if [[ "${status}" != "ACTIVE" || "${desired}" -lt 1 || "${running}" -lt "${desired}" || "${deployed_definition}" != "${new_definition}" ]]; then
  echo "Frontend service is unhealthy after deployment." >&2
  exit 1
fi

deployed_image="$(aws ecs describe-task-definition \
  --task-definition "${new_definition}" \
  --region "${aws_region}" \
  --query 'taskDefinition.containerDefinitions[?name==`frontend`].image | [0]' \
  --output text)"

if [[ "${deployed_image}" != "${image_uri}" ]]; then
  echo "Frontend task definition does not reference the requested immutable image." >&2
  exit 1
fi

echo "Frontend is stable at ${image_uri}."
