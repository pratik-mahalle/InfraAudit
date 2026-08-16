#!/usr/bin/env bash
set -euo pipefail

github_repository="${GITHUB_REPOSITORY:-pratik-mahalle/InfraAudit}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command is unavailable: $1" >&2
    exit 1
  fi
}

require_command aws
require_command gh
require_command jq

configure_webhook() {
  local project_name="$1"
  local event_pattern="$2"
  local ref_filter_type="$3"
  local github_event="$4"
  local filter_groups payload_url webhook_secret existing_hook hook_body webhook_response

  filter_groups="$(jq -cn \
    --arg event_pattern "${event_pattern}" \
    --arg ref_filter_type "${ref_filter_type}" \
    '[[
      {type:"EVENT", pattern:$event_pattern, excludeMatchedPattern:false},
      {type:$ref_filter_type, pattern:"^refs/heads/main$", excludeMatchedPattern:false}
    ]]')"

  payload_url="$(aws codebuild batch-get-projects \
    --names "${project_name}" \
    --query 'projects[0].webhook.payloadUrl' \
    --output text)"

  if [[ "${payload_url}" != "None" && -n "${payload_url}" ]]; then
    existing_hook="$(gh api "repos/${github_repository}/hooks" --paginate |
      jq -r --arg payload_url "${payload_url}" \
        '.[] | select(.active == true and .config.url == $payload_url) | .id' |
      head -n 1)"
    if [[ -n "${existing_hook}" ]]; then
      echo "Webhook for ${project_name} is already configured."
      return
    fi

    # CodeBuild does not return an existing webhook secret. Recreate only the
    # exact project webhook when its matching GitHub hook is absent.
    aws codebuild delete-webhook --project-name "${project_name}" >/dev/null
  fi

  webhook_response="$(aws codebuild create-webhook \
    --project-name "${project_name}" \
    --manual-creation \
    --filter-groups "${filter_groups}")"
  payload_url="$(jq -r '.webhook.payloadUrl' <<<"${webhook_response}")"
  webhook_secret="$(jq -r '.webhook.secret' <<<"${webhook_response}")"

  if [[ -z "${payload_url}" || "${payload_url}" == "null" || -z "${webhook_secret}" || "${webhook_secret}" == "null" ]]; then
    echo "CodeBuild did not return webhook credentials for ${project_name}." >&2
    exit 1
  fi

  hook_body="$(jq -cn \
    --arg url "${payload_url}" \
    --arg secret "${webhook_secret}" \
    --arg event "${github_event}" \
    '{name:"web",active:true,events:[$event],config:{url:$url,content_type:"json",insecure_ssl:"0",secret:$secret}}')"
  printf '%s' "${hook_body}" |
    gh api --method POST "repos/${github_repository}/hooks" --input - >/dev/null

  unset webhook_response webhook_secret hook_body
  echo "Configured ${github_event} webhook for ${project_name}."
}

configure_webhook \
  infraudit-production-frontend-pr-validation \
  "PULL_REQUEST_CREATED,PULL_REQUEST_UPDATED,PULL_REQUEST_REOPENED" \
  BASE_REF \
  pull_request

configure_webhook \
  infraudit-production-frontend-main-deploy \
  PUSH \
  HEAD_REF \
  push
