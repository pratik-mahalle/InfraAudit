# InfraAudit feature surface catalog

**Date:** 2026-08-15

**Status:** IA-005 product truth baseline

**Source revisions:** frontend `4aa846afd9fa5213e59861a579c17e8b9358cf53`; backend `a56819eee0a5eb026b3076e9766c7f577a587005`

## Purpose

This catalog classifies every registered frontend route and backend endpoint so product, engineering, and first-customer acceptance work use the same definition of what is trustworthy today. It is a source audit, not a replacement for the IA-003 end-to-end smoke test or the IA-006 customer acceptance report.

The audit found 47 leaf frontend routes plus the layout wildcard and not-found fallback in `client/src/App.tsx`, and 311 backend method registrations in `infraudit-go/internal/api/router/router.go`. Every registration is represented below either directly or in an explicitly expanded route family.

## Classification rules

| Classification | Meaning |
| --- | --- |
| **working** | The route or endpoint is wired to a real implementation and its primary contract is supported. Runtime dependencies can still return explicit errors or empty states. |
| **partial** | Useful real behavior exists, but a material state, provider, permission, evidence, dependency, or frontend/backend contract is incomplete. It must not be marketed as complete. |
| **placeholder** | The surface is registered or rendered but does not complete its claimed operation, returns an intentionally empty/fallback response, or calls an endpoint that does not exist. |
| **demo** | The surface intentionally simulates a result or operates only on local/example input and must not be treated as persisted customer evidence. |
| **deprecated** | A compatibility alias or superseded route remains callable. New callers must use the named replacement. |

“Working” means source-verified at the revisions above. It does not mean a live credential-dependent path was exercised for every provider.

## Ownership and permission key

The backend is authoritative. Product routes first require a valid Supabase identity, an active organization membership, and `view`; the request context carries the resolved organization and actor. Request bodies cannot select the owning organization. Repository ownership is not yet uniform, so route-level organization middleware must not be mistaken for organization-shared data.

| Key | Current behavior |
| --- | --- |
| Public | No user JWT. Kubernetes agent writes require a connector token. |
| Auth | Valid user JWT; organization membership is not required for onboarding/auth routes. |
| Org view | Active organization plus `view`; owner, admin, viewer, and deprecated `user` roles currently have it. |
| Scan | `scan`; all current application roles have it. |
| Providers | `manage_providers`; owner and admin. |
| Settings | `manage_settings`; owner and admin. |
| Team | `manage_team`; owner only. |
| Billing | `manage_billing`; owner only. |
| Organization | `manage_org`; owner only. |

Several product mutations currently require only Org view. Those surfaces are classified partial even when their storage code works because a viewer can mutate data. Frontend route hiding is a usability control only and never changes backend authorization.

### Persisted ownership modes

| Current mode | Surface families | Product consequence |
| --- | --- | --- |
| Organization-shared | Provider accounts, resources, organization/team settings, API keys, and Kubernetes connector inventory | Members in the same organization operate on the same records, with actor fields retained for attribution. |
| Organization plus actor | Alerts, drifts/scans, vulnerabilities, normalized findings, scheduled jobs/executions, compliance assessments, and reports | Queries require both organization and current actor. Members of one organization can see different data, so these collaborative surfaces remain partial. |
| Legacy actor-only | Recommendations, anomalies and cost data, baselines, incidents, direct Kubernetes/Helm records, IaC, policy, SBOM, notifications/webhooks, and remediation | Repository queries do not consistently use `organization_id`. The organization route boundary reduces exposure, but shared ownership and defense in depth are incomplete. |

This table records current query behavior. The accepted ownership ADR still defines the target: organization is the tenant root and user/profile IDs are attribution, not ownership.

## Frontend routes

### Authentication and public routes

| Route | Permission | Classification | Evidence and limitation |
| --- | --- | --- | --- |
| `/auth` | Public | **working** | Supabase email/password and OAuth entry surface with backend profile resolution. |
| `/auth/callback` | Public | **working** | Uses the same auth page to complete the Supabase callback. |
| `/signup` | Public | **working** | Creates the Supabase user and continues organization onboarding/approval behavior. |
| `/invite/:token` | Public/Auth on accept | **working** | Reads the public invitation and accepts it through the backend. |
| `/` | Public | **partial** | Marketing page renders and navigation works, but “real-time,” multi-cloud, automation, and trial claims exceed the completed surfaces in this catalog. |
| `/documentation` | Public | **partial** | Static overview contains stale repository links and claims for incomplete automation, compliance, and prediction behavior. AWS setup now points only to the cross-account role flow. |
| `/guide` | Public | **partial** | Navigable static guide, but it presents provider, alert, optimization, and trial behavior without the coverage/failure boundaries in the golden AWS journey. |
| `/guide/` | Public | **deprecated** | Duplicate alias for `/guide`. |
| `/guides` | Public | **deprecated** | Duplicate alias for `/guide`. |
| `/share/:token` | Public | **placeholder** | Calls unregistered `GET /api/dashboard/share/{token}`; no backend share contract exists. |
| `/api` | Public | **placeholder** | Advertises three unregistered paths: `/api/costs/summary`, `/api/security/findings`, and `/api/resources/utilization`. |
| `/pricing` | Public | **partial** | Static plans render, but paid checkout, billing portal, and trial enforcement are not implemented end to end. |
| `/about` | Public | **working** | Static company content and navigation only. |
| `/contact` | Public | **demo** | Waits locally, discards the form payload, resets the form, and displays “Message received.” Email/phone links are real. |
| `/privacy` | Public | **working** | Static legal content. |
| `/terms` | Public | **working** | Static legal content. |

### Authenticated product routes

| Route | Frontend guard | Classification | Evidence and limitation |
| --- | --- | --- | --- |
| `/dashboard` | Auth | **partial** | Uses real provider, Kubernetes, resource, drift, alert, finding, health, cost, and compliance data. First-value provenance, complete coverage, and some error states remain incomplete. |
| `/security` | Auth | **partial** | Real normalized findings, vulnerabilities, drift, and compliance views; evidence completeness and all scanner/provider states are not yet trustworthy as one complete posture. |
| `/drift-detection` | Auth | **partial** | Real drift lists, summaries, durable scans, filters, status changes, and explanations. Records are organization-plus-actor rather than organization-shared, and AI explanation remains configuration-dependent. |
| `/vulnerabilities` | Auth | **deprecated** | Redirects to `/security?view=vulnerabilities`. |
| `/findings/:id` | Auth | **partial** | Reads a normalized finding and supports the backend status lifecycle, but records are organization-plus-actor and viewer-accessible status mutation is too broad. |
| `/findings` | Auth | **deprecated** | Redirects to `/security?view=findings`. |
| `/recommendations` | Auth | **partial** | Reads real persisted recommendations; generation depends on AI/rule inputs and the frontend still uses deprecated `/api/recommendations` aliases. |
| `/billing-import` | Billing | **partial** | Uploads a real CSV, records import status/history, and invalidates cost views. Imported cost data remains actor-owned rather than organization-shared, and supported schemas are limited to the backend import contract. |
| `/cost` | Auth | **partial** | Real stored cost overview, trends, anomaly detection, and optimization records; provider billing coverage, AI output grounding, and freshness vary. |
| `/cost-prediction` | Auth | **partial** | Uses real cost history with linear/moving-average forecasts, but not a validated “ML” model or production forecast SLO. |
| `/resources/:id` | Auth | **working** | Reads an organization-scoped persisted resource and its available configuration/evidence. |
| `/resources` | Auth | **working** | Real paginated/filterable inventory with loading, error, and empty states. Coverage depends on provider sync status. |
| `/settings` | Settings | **partial** | Profile, team, API key, AI, notification, and webhook integrations are mixed; timezone/language are browser-local, some panels rely on optional delivery services, and owner-only admin content shares this route. |
| `/profile` | Auth | **working** | Displays resolved profile and provider summary. |
| `/cloud-providers` | Providers | **partial** | AWS now downloads the protected organization-bound role template and no longer collects new access keys. Role activation/validation remains IA-404; GCP and Azure still collect long-lived secrets. |
| `/kubernetes` | Providers | **partial** | Direct kubeconfig and connector inventory paths are real; direct access has reachability/secret constraints and Helm drift is a backend placeholder. |
| `/architecture-playground` | Auth | **partial** | Local diagram editing works, but save calls unregistered `POST /api/architecture`. |
| `/subscription/success` | Billing | **placeholder** | Calls unregistered `GET /api/subscriptions/plans`; no Stripe completion verification exists. |
| `/subscription/cancel` | Billing | **placeholder** | Static cancellation page for an unimplemented checkout flow. |
| `/subscription` | Billing | **placeholder** | Plan reads work through legacy billing aliases, but update/checkout explicitly return “coming soon” and the billing-portal endpoint is absent. |
| `/roi-calculator` | Auth | **demo** | Calculates local user-supplied values; email calls unregistered `POST /api/reports/roi/email`. It is not evidence from provider cost data. |
| `/compliance` | Auth | **deprecated** | Redirects to `/security?view=compliance`. |
| `/automation` | Auth | **partial** | Scheduled job CRUD and durable delivery exist for drift, vulnerability, and compliance; unsupported types and execution-history visualization remain incomplete. |
| `/iac` | Auth | **partial** | Upload/list/drift detection are real, but the frontend delete call uses missing alias `DELETE /api/iac/definitions/{id}` and live-state comparison is limited to normalized inventory. |
| `/sbom` | Auth | **partial** | Real report persistence/download exists; generation requires a working Trivy runtime and does not yet provide the full evidence/retention contract. |
| `/policies` | Auth | **partial** | Real Rego CRUD/evaluation and violation storage exist; AI generation is optional and policy/version/provenance coverage is incomplete. |
| `/alerts` | Auth | **partial** | Real persisted alert list, summary, filtering, CRUD, and status behavior. Records are organization-plus-actor and backend mutation permissions are broader than intended. |
| `/resource-analysis` | Auth | **partial** | Calls a real AI gateway when configured, but silently falls back to generic rule-based text and does not create durable evidence. |
| `/ai-demo` | Auth | **deprecated** | Redirects to `/resource-analysis`. |
| `/reports/:id` | Auth | **partial** | Reads durable report state and supports cancellation/email; delivery depends on notification configuration and report evidence completeness. |
| `/reports` | Auth | **partial** | Real durable report jobs/list/delete/cancel; API remains in the legacy `/api/reports` namespace and scanner coverage varies. |

### Structural routes

| Registration | Classification | Behavior |
| --- | --- | --- |
| Outer `*` route | **working** | Applies the shared layout to non-auth routes; it is not a standalone product URL. |
| Final route without a path | **working** | Renders the not-found surface when no leaf route matches. |

## Backend endpoints

Notation such as `GET|POST /path` represents both explicitly registered method/path pairs. Every relative path in a row is joined to the row’s displayed prefix.

### Platform, authentication, and organization

| Endpoint registration(s) | Access | Classification | Evidence and limitation |
| --- | --- | --- | --- |
| `GET /healthz`, `GET /readyz`, `ANY /metrics` | Public | **working** | Liveness, database readiness, and Prometheus metrics used by production operations. |
| `GET /health` | Public | **deprecated** | Compatibility alias for `/healthz`. |
| `GET /swagger/*` | Public | **partial** | Serves generated Swagger, but runtime aliases and several current contracts are not represented consistently. |
| `GET /api/invite/{token}`; `POST /api/invite/{token}/accept`; `POST /api/organizations` | Public lookup/Auth mutations | **working** | Invitation lookup/acceptance and organization creation with membership ownership. |
| `POST /api/auth/signup` | Auth | **working** | Active signup/profile provisioning contract in a legacy namespace. |
| `GET /api/v1/auth/me`; `PUT /api/v1/user/profile`; `POST /api/v1/auth/logout` | Auth | **working** | Canonical current-user, profile update, and logout endpoints. |
| `GET /api/v1/admin/users/`; `POST|DELETE /api/v1/admin/users/{id}/approve` | Organization | **working** | Owner-only pending-user list, approve, and reject behavior. |
| `GET|POST /api/v1/settings/api-keys/`; `DELETE /api/v1/settings/api-keys/{id}` | Settings | **working** | Organization-scoped API-key lifecycle; secret returned only on creation. |
| `GET /api/v1/settings/team/`; `POST /api/v1/settings/team/`; `PUT|DELETE /api/v1/settings/team/{id}` | Settings read; Team writes | **working** | Admin/owner can read; owner controls invitation and membership changes. |
| `GET /api/ws/drifts` | Org view | **partial** | Authenticated organization-filtered SSE, despite “WebSocket” naming; in-memory hub has no replay and is replica-local. |
| `GET /ws/drifts` | Org view | **deprecated** | Alias for `/api/ws/drifts`. |
| `POST /api/logout`; `POST /api/auth/logout`; `GET /api/auth/me`; `GET /api/user`; `PUT /api/user/profile` | Public logout/Auth | **deprecated** | Compatibility aliases. The current frontend still uses several and must migrate before removal. |

### Cloud connection, inventory, and security

| Endpoint registration(s) | Access | Classification | Evidence and limitation |
| --- | --- | --- | --- |
| `POST /api/v1/providers/aws/role-template` | Providers | **working** | Downloads one organization-bound read-only CloudFormation role template with exact workload principals and external-ID trust. It creates no IAM user or access key; role activation remains IA-404. |
| `GET /api/v1/providers/`; `GET /api/v1/providers/status`; `POST /api/v1/providers/{provider}/connect`; `POST /api/v1/providers/{provider}/sync`; `DELETE /api/v1/providers/{provider}` | Org view reads; Providers writes | **partial** | Real AWS/GCP/Azure validation, inventory, partial coverage, and status persistence. The legacy AWS connect contract and GCP/Azure still accept long-lived secrets, first auto-sync is API-goroutine based, and disconnect removes current resources. |
| `GET /api/v1/resources/`; `GET /api/v1/resources/{id}` | Org view | **working** | Organization-scoped resource inventory reads. |
| `POST /api/v1/resources/`; `PUT|DELETE /api/v1/resources/{id}` | Org view | **partial** | Real CRUD, but any viewer can mutate provider-derived inventory. |
| `POST /api/v1/resources/analyze` | Org view | **partial** | Real AI gateway with generic rule fallback; response is not durable evidence. |
| `GET /api/v1/health-score` | Org view | **partial** | Computes from open alerts and pending cost optimizations using a fixed unversioned deduction formula; incomplete inputs can look healthy. |
| `GET|POST /api/v1/alerts/`; `GET /api/v1/alerts/summary`; `GET|PUT|DELETE /api/v1/alerts/{id}` | Org view | **partial** | Persistence and anomaly integration work, but all mutations require only view and alert provenance/delivery is incomplete. |
| `GET|POST /api/v1/recommendations/`; `POST /api/v1/recommendations/generate`; `GET /api/v1/recommendations/savings`; `GET|PUT|DELETE /api/v1/recommendations/{id}` | Org view | **partial** | Real persistence and generator engine; quality/provenance depends on available resource/cost/AI inputs and mutation RBAC is broad. |
| `GET|POST /api/v1/drifts/`; `POST /api/v1/drifts/detect`; `GET /api/v1/drifts/summary`; `GET /api/v1/drifts/scans`; `GET /api/v1/drifts/scans/{id}`; `GET|PUT|DELETE /api/v1/drifts/{id}`; `GET /api/v1/drifts/{id}/explanation`; `POST /api/v1/drifts/{id}/explain` | Org view; Scan on detect | **partial** | Durable queued detection, scan state, reconciliation, and AI explanation work. Direct CRUD/explain permissions are broad and some evidence types remain incomplete. |
| `GET|POST /api/v1/incidents/`; `POST /api/v1/incidents/correlate`; `GET /api/v1/incidents/{id}`; `PUT /api/v1/incidents/{id}/status` | Org view | **partial** | Real persistence/correlation; write authorization and incident lifecycle/evidence are not production-complete. |
| `GET|POST /api/v1/anomalies/`; `POST /api/v1/anomalies/detect`; `GET /api/v1/anomalies/summary`; `GET|PUT|DELETE /api/v1/anomalies/{id}` | Org view | **partial** | Real two-sigma cost detection and persistence; limited model/context, broad writes, and incomplete run provenance. |
| `GET|POST /api/v1/baselines/`; `GET /api/v1/baselines/resource/{resourceId}`; `DELETE /api/v1/baselines/{id}` | Org view | **partial** | Real snapshot storage/comparison foundation; mutation RBAC and versioned evidence/retention are incomplete. |
| `GET /api/v1/vulnerabilities/`; `GET /api/v1/vulnerabilities/summary`; `GET /api/v1/vulnerabilities/top`; `POST /api/v1/vulnerabilities/scan`; `GET /api/v1/vulnerabilities/resource/{resourceId}`; `GET /api/v1/vulnerabilities/scans`; `POST /api/v1/vulnerabilities/scans/{id}/cancel`; `GET /api/v1/vulnerabilities/scans/{id}`; `GET /api/v1/vulnerabilities/{id}`; `PUT /api/v1/vulnerabilities/{id}/status`; `DELETE /api/v1/vulnerabilities/{id}` | Org view | **partial** | Durable queue, source diagnostics, native findings, and reconciliation exist; provider/scanner availability varies and mutation/scan guards are only view. |
| `GET /api/v1/findings/`; `GET /api/v1/findings/summary`; `GET /api/v1/findings/{id}`; `PUT /api/v1/findings/{id}/status` | Org view | **partial** | Normalized organization-plus-actor finding reads and lifecycle work; same-organization members do not share all records, status write is viewer-accessible, and full source/evidence convergence is ongoing. |

### IaC and Kubernetes

| Endpoint registration(s) | Access | Classification | Evidence and limitation |
| --- | --- | --- | --- |
| `GET /api/v1/iac/definitions`; `GET /api/v1/iac/definitions/{id}`; `GET /api/v1/iac/drifts`; `GET /api/v1/iac/drifts/summary`; `PUT /api/v1/iac/drifts/{id}/status`; `POST /api/v1/iac/upload`; `DELETE /api/v1/iac/definitions/{id}`; `POST /api/v1/iac/drifts/detect` | Org view reads/status; Providers upload/delete/detect | **partial** | Real Terraform, CloudFormation, and Kubernetes parsing/persistence and normalized-state comparison. Source provenance, parser coverage, and the status-write permission are incomplete. |
| `POST /api/v1/kubernetes/agent/heartbeat`; `POST /api/v1/kubernetes/agent/inventory` | Connector token | **working** | Durable connector heartbeat/inventory snapshots with organization-bound token authentication. |
| `GET /api/v1/kubernetes/connectors`; `GET /api/v1/kubernetes/connectors/{id}/snapshots`; `GET /api/v1/kubernetes/connectors/{id}/snapshots/{snapshotID}`; `POST /api/v1/kubernetes/connectors`; `DELETE /api/v1/kubernetes/connectors/{id}` | Org view reads; Providers writes | **working** | Real connector lifecycle and inventory snapshot reads. Raw connector token is returned only at creation. |
| `GET /api/v1/kubernetes/clusters`; `GET /api/v1/kubernetes/clusters/{id}`; `GET /api/v1/kubernetes/clusters/{clusterId}/namespaces`; `GET /api/v1/kubernetes/clusters/{clusterId}/deployments`; `GET /api/v1/kubernetes/clusters/{clusterId}/pods`; `GET /api/v1/kubernetes/clusters/{clusterId}/services`; `GET /api/v1/kubernetes/clusters/{clusterId}/resources`; `GET /api/v1/kubernetes/stats`; `POST /api/v1/kubernetes/clusters`; `DELETE /api/v1/kubernetes/clusters/{id}`; `POST /api/v1/kubernetes/clusters/{id}/sync` | Org view reads; Providers writes | **partial** | Real direct kubeconfig validation/storage and live reads; remote reachability, long-lived credential handling, and worker isolation are incomplete. |
| `GET /api/v1/kubernetes/clusters/{clusterId}/helm/releases`; `GET /api/v1/kubernetes/clusters/{clusterId}/helm/releases/{name}`; `POST /api/v1/kubernetes/clusters/{clusterId}/helm/sync` | Org view | **partial** | Persisted Helm release list/detail/sync works, but writes require only view. |
| `POST /api/v1/kubernetes/clusters/{clusterId}/helm/drift/detect`; `GET /api/v1/kubernetes/clusters/{clusterId}/helm/drift` | Org view | **placeholder** | Returns an intentionally empty drift result because no live Helm comparison is configured. |

### Billing, cost, compliance, automation, and evidence

| Endpoint registration(s) | Access | Classification | Evidence and limitation |
| --- | --- | --- | --- |
| `GET /api/v1/billing/plans`; `GET /api/v1/billing/info` | Org view | **demo** | Returns hard-coded Free/Pro/Enterprise plans and a synthetic active Free subscription with a future billing date; it does not read organization billing state. |
| `POST /api/v1/billing/subscription`; `POST /api/v1/billing/checkout` | Billing | **placeholder** | Explicitly returns that Stripe plan changes/checkout are not configured. |
| `GET /api/billing-import/status`; `GET /api/billing-import/history`; `POST /api/billing-import/upload` | Org view reads; Billing upload | **partial** | Real CSV parsing, import persistence, status, and history in an active legacy namespace, but imported costs/history remain actor-owned rather than organization-shared. |
| `GET /api/v1/costs/`; `GET /api/v1/costs/trends`; `POST /api/v1/costs/forecast/ai`; `GET /api/v1/costs/forecast`; `GET /api/v1/costs/roi`; `POST /api/v1/costs/sync`; `GET /api/v1/costs/savings`; `GET /api/v1/costs/{provider}`; `GET /api/v1/costs/anomalies/`; `POST /api/v1/costs/anomalies/detect`; `GET /api/v1/costs/optimizations/` | Org view | **partial** | Real AWS/GCP/Azure/billing-import storage, statistical forecasts, anomaly detection, and optional AI. Sync/detect writes are viewer-accessible; provenance, reconciliation, provider coverage, and forecast validation are incomplete. |
| `GET /api/v1/compliance/overview`; `GET /api/v1/compliance/trend`; `POST /api/v1/compliance/assess`; `GET /api/v1/compliance/controls/failing`; `GET /api/v1/compliance/frameworks/`; `GET /api/v1/compliance/frameworks/{id}`; `POST /api/v1/compliance/frameworks/{id}/enable`; `POST /api/v1/compliance/frameworks/{id}/disable`; `GET /api/v1/compliance/frameworks/{id}/controls`; `GET /api/v1/compliance/assessments/`; `GET /api/v1/compliance/assessments/{id}`; `POST /api/v1/compliance/assessments/{id}/cancel`; `GET /api/v1/compliance/assessments/{id}/export`; `GET /api/v1/compliance/resources/{id}` | Org view | **partial** | Durable assessment jobs and evidence-backed controls exist, but some required evaluators report unimplemented, framework writes are broadly authorized, and not every pass has durable evidence. |
| `GET|POST /api/v1/jobs/`; `GET /api/v1/jobs/types`; `GET|PUT|DELETE /api/v1/jobs/{id}`; `POST /api/v1/jobs/{id}/run`; `GET /api/v1/jobs/{id}/executions` | Org view | **partial** | Durable scheduling is production-wired for drift, vulnerability, and compliance. Other exposed job types are unsupported by the scheduler and all job writes require only view. |
| `GET /api/v1/queue/jobs/{id}`; `POST /api/v1/queue/jobs/{id}/cancel`; `GET /api/v1/executions/{id}`; `POST /api/v1/executions/{id}/cancel` | Org view | **partial** | Durable organization-plus-actor queue/execution status and cancellation work, but same-organization operators do not have a shared operational view. |
| `POST /api/reports/scan`; `GET /api/reports`; `GET /api/reports/{id}`; `GET /api/reports/{id}/status`; `POST /api/reports/{id}/cancel`; `DELETE /api/reports/{id}`; `POST /api/reports/{id}/email` | Scan on start/cancel; Org view otherwise | **partial** | Durable report jobs and persisted result lifecycle work in a legacy namespace; source completeness and configured email delivery vary, while delete/email use only view. |
| `POST /api/v1/sbom/generate`; `GET /api/v1/sbom/reports`; `GET /api/v1/sbom/reports/{id}`; `GET /api/v1/sbom/reports/{id}/download`; `DELETE /api/v1/sbom/reports/{id}` | Org view | **partial** | Real Trivy-backed generation and persistence when the binary/runtime can scan the target; evidence retention and write authorization are incomplete. |

### Policy, AI, remediation, and notification

| Endpoint registration(s) | Access | Classification | Evidence and limitation |
| --- | --- | --- | --- |
| `GET /api/v1/ai/providers` | Org view | **partial** | Lists server-configured providers; the control-plane work in draft PR #165 is not part of this baseline. |
| `GET /api/v1/ai/config`; `PUT /api/v1/ai/config/user`; `PUT /api/v1/ai/config/org`; `DELETE /api/v1/ai/config/user`; `GET /api/v1/ai/runs` | Settings | **partial** | Configuration/run persistence exists, but provider availability, policy semantics, and audit/provenance are still being revised. |
| `GET|POST /api/v1/policies/`; `GET /api/v1/policies/templates`; `POST /api/v1/policies/generate`; `POST /api/v1/policies/evaluate`; `GET /api/v1/policies/violations`; `PUT /api/v1/policies/violations/{id}/status`; `GET|PUT|DELETE /api/v1/policies/{id}` | Org view | **partial** | Real Rego validation/evaluation and persisted violations; mutation RBAC, versioned bundles, decision provenance, and optional AI generation are incomplete. |
| `GET /api/v1/remediation/summary`; `GET /api/v1/remediation/pending`; `POST /api/v1/remediation/suggest/drift/{id}`; `POST /api/v1/remediation/suggest/vulnerability/{id}`; `POST /api/v1/remediation/ai-suggest`; `GET|POST /api/v1/remediation/actions/`; `GET /api/v1/remediation/actions/{id}`; `POST /api/v1/remediation/actions/{id}/execute`; `POST /api/v1/remediation/actions/{id}/approve`; `POST /api/v1/remediation/actions/{id}/rollback` | Org view suggest/read/create; Settings execute/approve/rollback | **partial** | Real action persistence and selected GitHub/cloud/policy executors exist, but UI/API contract repair is still open, approval separation and rollback guarantees are incomplete, and provider credentials are legacy. |
| `GET /api/v1/notifications/preferences`; `PUT /api/v1/notifications/preferences/{channel}`; `GET /api/v1/notifications/history`; `POST /api/v1/notifications/send` | Org view | **partial** | Real user-scoped preference/history and configured email/Slack/webhook delivery; ownership is not organization-shared, delivery dependencies vary, and send/preferences writes are viewer-accessible. |
| `GET|POST /api/v1/webhooks/`; `GET /api/v1/webhooks/events`; `GET|PUT|DELETE /api/v1/webhooks/{id}`; `POST /api/v1/webhooks/{id}/test` | Settings | **partial** | User-scoped webhook CRUD/test and HMAC delivery work, but ID-based reads/updates/deletes are not tenant-filtered, webhook secrets are stored and serialized on the domain model, and asynchronous delivery is process-local. Tenant enforcement, secret redaction/encryption, and durable retry are incomplete. |

### Compatibility aliases

Every endpoint below is **deprecated** unless a more severe placeholder is stated. Aliases retain the authorization of their canonical handler/middleware group and must remain until frontend callers and external users migrate.

| Alias registrations | Replacement or note |
| --- | --- |
| `GET|POST /api/settings/api-keys/`; `DELETE /api/settings/api-keys/{id}` | `/api/v1/settings/api-keys...` |
| `GET /api/settings/team/`; `POST /api/settings/team/`; `PUT|DELETE /api/settings/team/{id}` | `/api/v1/settings/team...` |
| `GET|POST /api/resources`; `POST /api/resources/analyze`; `GET|PUT|DELETE /api/resources/{id}` | `/api/v1/resources...` |
| `GET /api/security-drifts`; `GET|POST /api/drifts`; `POST /api/drifts/detect`; `GET /api/drifts/summary`; `GET|PUT|DELETE /api/drifts/{id}`; `GET /api/drifts/{id}/explanation`; `POST /api/drifts/{id}/explain` | `/api/v1/drifts...`; `/api/security-drifts` is a list-only alias. |
| `GET|POST /api/alerts`; `GET /api/alerts/summary`; `GET|PUT|DELETE /api/alerts/{id}` | `/api/v1/alerts...` |
| `GET|POST /api/recommendations`; `POST /api/recommendations/generate`; `GET /api/recommendations/savings`; `GET /api/recommendations/{id}` | `/api/v1/recommendations...`; legacy aliases omit update/delete. |
| `GET|POST /api/anomalies`; `POST /api/anomalies/detect`; `GET /api/anomalies/summary`; `GET /api/anomalies/{id}` | `/api/v1/anomalies...`; legacy aliases omit update/delete. |
| `GET /api/providers/`; `GET /api/providers/status`; `POST /api/providers/{provider}/connect`; `POST /api/providers/{provider}/sync`; `DELETE /api/providers/{provider}` | `/api/v1/providers...` |
| `GET|POST /api/baselines`; `GET /api/baselines/resource/{resourceId}`; `DELETE /api/baselines/{id}` | `/api/v1/baselines...` |
| `GET /api/vulnerabilities`; `GET /api/vulnerabilities/summary`; `GET /api/vulnerabilities/top`; `POST /api/vulnerabilities/scan`; `GET /api/vulnerabilities/resource/{resourceId}`; `GET /api/vulnerabilities/scans`; `POST /api/vulnerabilities/scans/{id}/cancel`; `GET /api/vulnerabilities/scans/{id}`; `GET /api/vulnerabilities/{id}`; `PUT /api/vulnerabilities/{id}/status`; `DELETE /api/vulnerabilities/{id}` | `/api/v1/vulnerabilities...` |
| `GET /api/iac/definitions`; `GET /api/iac/drifts`; `GET /api/iac/drifts/summary`; `POST /api/iac/upload`; `POST /api/iac/drifts/detect` | `/api/v1/iac...`. Frontend still depends on these; detail/delete aliases were never registered. |
| `GET /api/kubernetes/clusters`; `GET /api/kubernetes/clusters/{id}`; `GET /api/kubernetes/clusters/{clusterId}/namespaces`; `GET /api/kubernetes/clusters/{clusterId}/deployments`; `GET /api/kubernetes/clusters/{clusterId}/pods`; `GET /api/kubernetes/clusters/{clusterId}/services`; `GET /api/kubernetes/clusters/{clusterId}/resources`; `GET /api/kubernetes/stats`; `POST /api/kubernetes/clusters`; `DELETE /api/kubernetes/clusters/{id}`; `POST /api/kubernetes/clusters/{id}/sync` | `/api/v1/kubernetes...` |
| `GET /api/kubernetes/clusters/{clusterId}/helm/releases`; `GET /api/kubernetes/clusters/{clusterId}/helm/releases/{name}`; `POST /api/kubernetes/clusters/{clusterId}/helm/sync` | `/api/v1/kubernetes/clusters/{clusterId}/helm...` |
| `POST /api/kubernetes/clusters/{clusterId}/helm/drift/detect`; `GET /api/kubernetes/clusters/{clusterId}/helm/drift` | **placeholder** aliases for the canonical Helm placeholder. |
| `GET /clusters/{clusterId}/helm/releases`; `GET /clusters/{clusterId}/helm/releases/{name}`; `POST /clusters/{clusterId}/helm/sync` | Unversioned top-level aliases for canonical Kubernetes Helm routes. |
| `POST /clusters/{clusterId}/helm/drift/detect`; `GET /clusters/{clusterId}/helm/drift` | **placeholder** top-level aliases for the canonical Helm placeholder. |
| `GET /api/billing/plans`; `GET /api/billing/info` | `/api/v1/billing...`; current frontend still uses these aliases. |
| `POST /api/billing/subscription`; `POST /api/billing/checkout` | **placeholder** aliases for the canonical Stripe placeholders. |

Active endpoints in `/api/auth`, `/api/invite`, `/api/organizations`, `/api/billing-import`, and `/api/reports` do not yet have complete `/api/v1` replacements. They are classified in the main tables rather than called deprecated solely because of their namespace.

## Confirmed frontend/backend contract gaps

| Frontend call or claim | Backend reality | Classification impact |
| --- | --- | --- |
| `GET /api/dashboard/share/{token}` | No route | `/share/:token` is placeholder. |
| `POST /api/architecture` | No route | Playground persistence is partial. |
| `GET /api/subscriptions/plans` | No route; plans are under `/api/v1/billing/plans` | Subscription success is placeholder. |
| `POST /api/subscriptions/billing-portal` | No route | Subscription management is placeholder. |
| `POST /api/reports/roi/email` | No route | ROI calculator is demo-only. |
| `GET /api/iac/definitions/{id}` and `DELETE /api/iac/definitions/{id}` | Only `/api/v1/iac/definitions/{id}` exists | IaC detail/delete client contract is partial. |
| API page’s `/api/costs/summary`, `/api/security/findings`, `/api/resources/utilization` | No routes | Public API reference is placeholder. |
| Trial redirect/banner comments reference trial status/start APIs | No trial endpoints; both controls are no-ops | Pricing/trial experience is partial. |
| Dashboard personalization and Kubernetes-cost components reference `/api/user-preferences` and `/api/kubernetes/costs` | No routes; components are not mounted in a registered route | Orphan components must not be counted as shipped features. |

## Cross-cutting reliability and data handling

- **Ownership:** the router establishes organization context, but the persisted ownership table above is the current truth. Actor-only and organization-plus-actor repositories must migrate before organization collaboration can be called working.
- **Idempotency:** River-backed drift, vulnerability, compliance, and report jobs use durable logical job identities and retry behavior. Most synchronous CRUD/connect/sync/send endpoints do not accept an idempotency key; duplicate prevention varies by repository.
- **Retries:** River jobs retry durably. Direct provider connect/sync, notification sends, SSE delivery, and API-goroutine auto-sync do not share one documented retry/dead-letter contract.
- **Telemetry:** HTTP metrics, structured logs, OpenTelemetry middleware, queue/scheduler events, and production alarms exist. Per-surface success/partial/empty metrics and end-to-end correlation remain uneven.
- **Sensitive data:** Supabase JWTs, API keys, connector tokens, provider secrets, kubeconfigs, notification/webhook secrets, and short-lived cloud credentials must never appear in this catalog’s evidence. Current provider connections and direct Kubernetes connections persist long-lived customer secrets and are therefore partial until their migration work completes.
- **Mutation authorization:** many canonical resource, alert, recommendation, drift, incident, anomaly, baseline, vulnerability, finding, cost, compliance, job, SBOM, policy, and notification mutations inherit Org view. A later RBAC task must assign explicit operation permissions before those surfaces can be considered fully working for multi-role customers.

## Migration, rollback, and catalog maintenance

This task changes documentation only; it has no database migration or runtime rollback. Reverting this document reverts the catalog but does not change product behavior.

For product migrations:

1. migrate frontend callers from deprecated aliases before removing an alias;
2. preserve response compatibility for at least one release or publish a versioned breaking change;
3. add replacement tests and telemetry before disabling an old route;
4. keep static-key and other secret migrations additive until new identity validation succeeds; and
5. never relabel a partial/placeholder/demo surface as working without test or operational evidence linked in the change.

Any PR that adds, removes, redirects, or materially changes a frontend route or backend endpoint must update this catalog in the same change until a generated service catalog replaces it.

## Audit and acceptance procedure

The source inventory was produced with:

```bash
rg -n "<(ProtectedRoute|Route)( |>)" client/src/App.tsx
rg -n "r\.(Get|Post|Put|Patch|Delete|Handle)\(|r\.With\([^\n]+\)\.(Get|Post|Put|Patch|Delete)\(" internal/api/router/router.go
```

Acceptance for IA-005 requires:

1. the frontend command reports 49 registrations: 47 leaf routes, the outer wildcard, and the final fallback;
2. the backend command reports 311 method registrations and every one maps to a row/family above;
3. the five classification labels are used consistently and no surface is “unknown”;
4. current organization/RBAC behavior and known over-broad mutations are explicit;
5. confirmed missing frontend/backend contracts are not presented as working;
6. the document contains no credential, connector token, external ID, provider response, or customer data; and
7. frontend type-check/build and repository security checks pass for the documentation change.

IA-006 must use this catalog plus IA-003/IA-004 evidence to decide which outputs a first customer may trust. Draft PRs #165 and backend #166 are intentionally outside the source revisions above and must update classifications when they merge.
