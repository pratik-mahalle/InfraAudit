# GCP and Azure cloud-provider improvement plan

**Date:** 2026-08-17  
**Status:** Proposed execution plan  
**Related contract:** [Golden AWS journey](2026-08-15-golden-aws-journey.md)

## Outcome

Make GCP and Azure first-class, organization-owned providers with the same
trust, onboarding, progress, diagnostics, inventory, security, compliance, and
cost guarantees as the AWS journey.

The customer should be able to connect one GCP project or Azure subscription,
without pasting a long-lived private key or client secret, and receive
explainable inventory and security results within the Phase 0 five-minute
acceptance target. Existing static-key connections remain readable during a
bounded migration period but are never the target onboarding path.

## Current state and gaps

The product already has GCP and Azure collectors for core compute and storage,
provider cost adapters, native finding adapters, provider forms, and opt-in
live validation tests. The material gaps are:

- GCP onboarding stores a service-account JSON key.
- Azure onboarding stores a client secret.
- Connection validation checks only a small identity/inventory call and does
  not return per-source capability diagnostics.
- Provider setup is a credential form instead of a pending, auditable setup
  workflow.
- Inventory, native findings, compliance, and cost sources do not share one
  customer-visible capability/status contract.
- Manual sync and post-connect sync still need durable job identity,
  idempotency, progress, and recovery guarantees for both providers.
- Revocation, migration, deletion reconciliation, and source-level evidence
  need explicit tests against controlled GCP and Azure tenants.

## Target security model

### GCP

Use Google Workload Identity Federation (WIF) from the InfraAudit AWS worker
identity to a customer-created GCP workload identity pool/provider and a
dedicated service account. The customer grants only the required read roles and
`roles/iam.workloadIdentityUser` on that service account. InfraAudit exchanges
short-lived AWS-backed subject tokens for short-lived GCP access tokens.

No service-account private key is accepted for new connections. Existing JSON
key connections are labeled `legacy credentials` and can only enter the
migration flow.

Required capabilities are Compute Engine, Cloud Storage, Cloud Asset Inventory,
and project/region discovery. Security Command Center and BigQuery billing are
optional capabilities with independent status.

### Azure

Use Azure Lighthouse to delegate the customer subscription to the InfraAudit
multi-tenant service principal with subscription-scoped Reader,
Security Reader, and Cost Management Reader access. The customer deploys a
reviewable ARM/Bicep template and grants consent in its tenant; InfraAudit uses
its own short-lived tenant credential and never receives a customer client
secret.

The connection records tenant ID, subscription ID, delegated principal/object
identity, and capability state. Existing client-secret connections are labeled
`legacy credentials` and can only enter the migration flow.

## User-visible contract

### Setup lifecycle

Both providers use the same lifecycle:

`draft -> pending_setup -> validating -> connected/syncing -> connected | partial | error`

Disconnecting stops new provider calls and scheduled jobs immediately, retains
historical records as stale, and instructs the operator to remove the GCP WIF
binding or Azure Lighthouse delegation.

### API contract

All new endpoints are under `/api/v1`, organization-scoped, authenticated,
and protected by `manage_providers` for mutations.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/providers/gcp/setup` | Create/reuse an idempotent GCP pending setup and return a redacted WIF bootstrap artifact. |
| `POST` | `/providers/azure/setup` | Create/reuse an idempotent Azure Lighthouse setup and return a reviewable ARM/Bicep artifact. |
| `GET` | `/providers/{provider}/connections/{id}` | Return setup/validation/sync state without credentials or tokens. |
| `POST` | `/providers/{provider}/connections/{id}/validate` | Validate identity, account scope, trust/delegation, and selected capabilities. |
| `POST` | `/providers/{provider}/connections/{id}/sync` | Enqueue the first or manual durable sync and return the logical job ID. |
| `GET` | `/providers/{provider}/connections/{id}/diagnostics` | Return source-level outcomes, coverage, timestamps, safe error categories, and remediation guidance. |
| `POST` | `/providers/{provider}/connections/{id}/migrate` | Start legacy-key migration and shadow validation; owner/admin only. |
| `DELETE` | `/providers/{provider}/connections/{id}` | Disconnect, stop future calls, mark data stale, and emit an audit event. |

Existing `/providers/{provider}/connect`, `/sync`, and `DELETE /providers/{provider}`
aliases remain during migration and delegate to the new connection service.

### Diagnostics contract

Every provider exposes the same source outcome values:

`success_with_data`, `success_empty`, `partial`, `permission_denied`,
`rate_limited`, `not_configured`, `stale`, `failed`, and `cancelled`.

Each source record includes source name, capability, attempted/completed time,
duration, fetched/normalized/reconciled counts, freshness, safe error code,
and operator guidance. It never includes raw cloud responses, tokens, private
keys, client secrets, or resource configuration blobs.

## Persistence and tenancy

Add organization-owned provider connection records without weakening the
existing organization boundary:

- provider, organization, cloud scope identifier, display name, auth method,
  lifecycle state, created/updated timestamps, and actor attribution;
- encrypted legacy credential reference only where migration requires it;
- WIF/Lighthouse configuration identifiers, never exchanged tokens;
- capability and source-diagnostic rows keyed by connection and sync/job;
- idempotency key and setup expiry for pending setup;
- audit events for setup, validation, sync request, migration, revocation,
  disconnect, and recovery.

Provider resources, findings, costs, compliance assessments, jobs, and evidence
must be queried by `organization_id` and connection/account scope. A foreign
organization ID returns forbidden or not found without existence leakage.

## Implementation sequence

### Milestone 1 — Shared connection foundation

1. Define the connection state machine and provider-neutral DTOs.
2. Add organization-scoped connection and capability migrations.
3. Add repository/service interfaces, idempotency, audit events, and redacted
   diagnostics.
4. Preserve the existing aliases and map them to the new service.
5. Add owner/admin/viewer and cross-organization authorization tests.

### Milestone 2 — GCP WIF onboarding

1. Generate the customer setup artifact for a workload identity pool/provider,
   service account, and least-privilege bindings.
2. Validate project identity, WIF audience/provider, service-account
   impersonation, enabled APIs, regions, Asset Inventory, SCC, and optional
   BigQuery billing access.
3. Replace provider clients' JSON-key path with short-lived WIF credentials.
4. Keep GCE/GCS collection, expand Asset Inventory coverage, and preserve
   partial-source merge/reconciliation semantics.
5. Add GCP setup UI, progress, capability cards, empty/partial/error states,
   and diagnostics detail.

### Milestone 3 — Azure Lighthouse onboarding

1. Generate a customer-reviewable ARM/Bicep delegation artifact with exact
   InfraAudit principal and read-only role assignments.
2. Validate tenant/subscription identity, Lighthouse delegation, Reader,
   Security Reader, Resource Graph, Defender, and optional Cost Management
   capabilities independently.
3. Replace customer client-secret use with the InfraAudit delegated identity.
4. Keep VM/VMSS/storage collection and extend Resource Graph normalization for
   broader supported inventory.
5. Add Azure setup UI, consent/deployment instructions, progress, capability
   cards, and diagnostics detail.

### Milestone 4 — Durable scans and explainable outputs

1. Enqueue initial and manual syncs through the dedicated worker.
2. Persist attempts, retries, cancellation, timeout, queue age, and terminal
   state under one logical job ID.
3. Record source diagnostics for inventory, native findings, compliance, and
   cost independently.
4. Reconcile only after complete scope scans; preserve inaccessible prior data
   as stale/unknown during partial scans.
5. Expose resource/finding/cost provenance, observation time, and source state
   in dashboard, security, compliance, and cost pages.

### Milestone 5 — Legacy migration and revocation

1. Label existing GCP JSON-key and Azure client-secret connections as legacy.
2. Generate a pending WIF/Lighthouse connection for the same organization and
   cloud scope.
3. Run a shadow inventory and compare identity, capability, and resource
   counts with the last successful legacy sync.
4. Atomically switch new jobs to the short-lived identity.
5. Purge the legacy secret only after owner/admin confirmation and provide
   exact customer-side revoke/delete instructions.
6. Test rollback before switch and repair-only recovery after switch; never
   silently reactivate a legacy secret.

## Frontend work

- Replace GCP/Azure secret textareas with guided setup, copy/download artifact,
  deployment confirmation, and identity validation steps.
- Add provider connection query keys that include organization and connection
  ID; invalidate list, detail, diagnostics, dashboard, security, compliance,
  inventory, and cost queries after state changes.
- Show `pending_setup`, `validating`, `syncing`, `partial`, `stale`, and
  `error` states explicitly.
- Keep provider mutation controls hidden/disabled for viewers while allowing
  viewer read access to status, diagnostics, and outputs.
- Add safe empty states: empty account, no findings, unavailable source,
  not-scanned, and stale data must remain distinct.
- Add PostHog events only for non-sensitive lifecycle categories; never send
  project IDs, subscription IDs, tenant IDs, role IDs, secrets, or payloads.

## Acceptance and test fixtures

Create controlled fixtures for each provider:

- normal resources and findings;
- empty project/subscription;
- one denied optional source;
- required permission denial;
- throttling/transient failure;
- duplicate setup/validate/sync requests;
- worker restart during collection;
- revoked WIF binding or Lighthouse delegation;
- complete scan reconciliation and partial-scan preservation.

Release acceptance requires:

1. Owner/admin can complete setup and validation without a long-lived customer
   secret; viewer cannot mutate it.
2. Account/subscription identity mismatch is rejected before persistence.
3. Inventory, native findings, compliance, and cost source outcomes are
   independently explainable.
4. Empty results are not presented as proof of safety without coverage.
5. At least one completed inventory view appears within three minutes and the
   first complete value within five minutes for the Phase 0 fixture.
6. Duplicate requests produce one connection, job, snapshot, finding, and
   notification.
7. Revocation leaves last-known data stale and gives actionable repair steps.
8. No cloud secret, token, setup artifact, or raw provider payload appears in
   persistence outside approved encrypted fields, logs, traces, analytics, or
   API responses.

## Delivery order and ownership

1. Backend: shared connection/diagnostics contract and migrations.
2. Backend: GCP WIF provider and live validation.
3. Frontend: GCP guided setup and diagnostics.
4. Backend: Azure Lighthouse provider and live validation.
5. Frontend: Azure guided setup and diagnostics.
6. Backend/worker: durable sync, source evidence, reconciliation, and retry
   tests for both providers.
7. Full-stack: legacy migration, revocation, acceptance report, and rollout.

Do not begin broad multi-cloud feature expansion or remediation until the
provider setup, source diagnostics, tenant isolation, and revocation tests pass
for both clouds.
