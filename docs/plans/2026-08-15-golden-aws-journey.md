# Golden AWS journey

**Date:** 2026-08-15

**Status:** Target product contract for IA-001

**Scope:** The first customer connects one AWS account to one InfraAudit organization and receives explainable inventory, security, compliance, and cost value.

## Outcome and boundary

The golden journey starts with an authenticated organization member and ends when that member can see fresh AWS inventory, coverage diagnostics, security findings, compliance results, and cost data that can be traced to a completed scan. For the Phase 0 test fixture, that value must appear within five minutes of a valid connection.

The target connection mechanism is a customer-deployed, read-only cross-account IAM role protected by a per-connection external ID. InfraAudit must not ask a customer for an AWS access key or secret key. A future remediation identity is separate, optional, and outside this journey.

This is a target contract, not a claim that every step is implemented. The current gaps are listed in [Implementation status and handoffs](#implementation-status-and-handoffs).

## Personas and permissions

| Persona | InfraAudit access | AWS access | Responsibilities |
| --- | --- | --- | --- |
| Organization owner | `view`, `scan`, and `manage_providers` plus organization, team, billing, and settings administration | None required | Owns the connection, authorizes an administrator or AWS operator, approves migration and disconnect decisions, and can inspect all results. |
| Organization admin | `view`, `scan`, `manage_providers`, and settings administration | None required | Creates, validates, syncs, updates, and disconnects provider connections; can inspect all results. |
| Viewer | `view` and `scan`; no `manage_providers` | None | Reads connection status and outputs and may request supported scans, but cannot connect, update, manually sync, or disconnect an account. |
| AWS IAM operator | No InfraAudit role is required if an owner or admin provides the generated stack link | Permission to create/update/delete the supplied CloudFormation stack and named IAM role | Reviews and deploys the read-only role, returns the stack output to the InfraAudit owner/admin, and revokes it when requested. |
| InfraAudit scanner workload | No interactive login | `sts:AssumeRole` from the documented InfraAudit workload principal, with the exact external ID | Uses only short-lived role credentials for validation, inventory, security, compliance, and cost reads. |

Provider connections and all derived records belong to the active `organization_id`; the initiating profile is actor attribution, not the ownership boundary. Reads are organization-scoped. Cross-organization identifiers must return forbidden or not found without revealing whether a connection exists.

The deprecated `user` application role has the same effective product permissions as `viewer` and follows the viewer behavior above until it is removed.

The first-customer scope supports one AWS account connection per InfraAudit organization. Multi-account organizations and AWS Organizations aggregation are later extensions and must not be simulated by sharing one connection across tenants.

## AWS permission boundary

The CloudFormation template creates an inventory role with:

- trust limited to the documented InfraAudit workload role, never an account root principal or a human user;
- an exact, cryptographically random external ID unique to the pending organization connection;
- no write, mutation, `iam:PassRole`, or remediation actions;
- read actions for account identity, enabled regions, EC2 instances, VPCs, VPC flow logs, security groups, EBS volumes, RDS instances, S3 buckets and their security configuration, and IAM users, MFA devices, and roles;
- Cost Explorer read access as an explicitly reported coverage capability; and
- Security Hub and Inspector read access only when native-finding ingestion is enabled.

The reviewed policy in `infraudit-go/docs/aws-inventory-permissions.md` is the current collector baseline. IA-401 owns the final split between inventory, billing, native-security, and future remediation policies. Remediation permission must never be added to the inventory role.

## Happy path

1. **Start in the active organization.** An owner or admin opens Cloud Providers and selects AWS. InfraAudit shows the organization that will own the connection and creates a pending connection ID plus external ID.
2. **Review the permission boundary.** The user sees the exact InfraAudit principal, role policy, optional capabilities, selected regions, and a plain-language statement that the role is read-only. No access-key form is present.
3. **Deploy the stack.** The user or AWS IAM operator launches the generated CloudFormation template in the intended AWS account. The stack outputs the AWS account ID and role ARN. CloudFormation rollback leaves no usable connection in InfraAudit.
4. **Validate before saving.** The owner/admin returns the role ARN. InfraAudit assumes the role with the pending external ID, calls `sts:GetCallerIdentity`, verifies the returned account and ARN, discovers enabled regions, and probes required and optional read capabilities. A connection is not marked connected when trust or identity validation fails.
5. **Create one durable connection.** InfraAudit binds the validated AWS account to the active organization, records the actor in the audit trail, and enqueues the first inventory sync. A repeated submit for the same pending connection returns the same connection and job rather than creating duplicates.
6. **Show progress.** The UI moves through `validating`, `connected / syncing`, and then `connected`, `partial`, or `error`. It shows the job ID, elapsed time, last successful sync, coverage summary, and a safe diagnostic. Navigating away does not cancel the job.
7. **Publish first inventory.** The completed sync shows counts by resource type and region. Accessible collectors update their data; unavailable collectors are labeled as reduced coverage rather than being silently omitted.
8. **Run evidence scans.** The user requests the supported vulnerability and compliance scans. Local AWS checks and enabled native AWS sources produce normalized findings; each result links to its source, affected resource, severity, observation time, and scan/job.
9. **Show first value.** The dashboard displays resource counts, health/security summary, findings, compliance results, cost coverage, freshness, and explicit empty states. An empty result is never presented as proof of safety without coverage evidence.

## Expected outputs

### Inventory

| Scope | Expected resource types | Minimum evidence |
| --- | --- | --- |
| Every enabled region | EC2 instances, VPCs, security groups, EBS volumes, and RDS instances | AWS resource ID, account, region, type, display name, status, selected configuration, collection time, and source scan/job. |
| Global or service-derived scope | S3 buckets, IAM users, and IAM roles | Stable AWS identifier, type, relevant security configuration, collection time, and source scan/job. |

An account with none of a supported resource type produces a successful zero count for that collector. If the role cannot read a collector, the count is unknown—not zero—and the coverage panel identifies the service/region and safe remediation guidance.

### Security and compliance

The first supported local AWS checks are public S3 access, security groups open to SSH or RDP, root-account MFA, and IAM console users without MFA. Failed checks become findings or security drifts with a stable rule ID and resource identity; rerunning the same observation does not create another open logical finding.

When enabled and permitted, Security Hub and Inspector contribute normalized cloud-native findings. A source that is disabled or has no results reports `success_empty`; permission denial reports `partial` with that source named. CIS AWS compliance results must identify the framework/control version and the findings or observations used as evidence.

### Cost

When Cost Explorer is enabled and permitted, InfraAudit returns the last 30 days of daily unblended cost grouped by AWS service and region, in the reported currency. Cost data carries its own freshness and coverage status because AWS billing data can lag inventory. Missing billing permission makes cost coverage partial; it does not invalidate inventory.

### Explainability and empty states

Every summary links back to resource or finding records and displays `observed_at`/last-sync time. The UI distinguishes:

- **empty account:** all required collectors succeeded and returned zero resources;
- **no findings:** enabled sources completed and returned zero open findings;
- **source unavailable:** a service is disabled, unsupported, or denied;
- **not scanned:** no completed scan exists yet; and
- **stale:** last known data exists but the role can no longer refresh it.

Passed local checks are not currently stored as durable evidence. Until that is implemented, “no local security drift” must not be phrased as a complete compliance pass.

## Timing and freshness targets

These are acceptance targets for the disposable IA-002 account, not measured production SLOs. IA-004 records the baseline and either confirms or revises them with evidence.

| Milestone | Target | Measurement |
| --- | --- | --- |
| Connection request accepted | 2 seconds | Browser submit to API response/job ID. |
| STS identity and trust validation | 30 seconds | Validation start to durable connection or actionable failure. |
| First inventory visible | 3 minutes | Connection accepted to at least one completed inventory view. |
| First complete value | 5 minutes | Connection accepted to inventory, coverage, local security results, and any enabled native/cost outputs reaching terminal states. |
| Manual scan acknowledgement | 2 seconds | Scan request to durable job ID. |
| Progress freshness while active | 15 seconds | Age of the latest UI-visible status update. |
| Connected-account freshness | 24 hours | Age of last successful scheduled inventory before the UI marks data stale. |

The Phase 0 performance envelope is one AWS account, up to 25 enabled regions, 1,000 supported resources, and 1,000 native findings. Larger accounts may exceed the five-minute target and must display progress rather than time out silently.

## Failure and recovery contract

| Failure | Customer-visible result | Data behavior | Retry/recovery |
| --- | --- | --- | --- |
| Wrong principal, external ID, role ARN, or deleted role | Validation fails with a trust/identity message; connection is not marked connected | No credentials or partial provider record becomes active | Permanent until the stack or role ARN is corrected; a retry reuses the pending connection. |
| Valid role in a different AWS account than the selected/returned account | Account mismatch | No active connection or cross-account data is written | Permanent until the correct account deploys the stack. |
| Required identity or region-discovery permission denied | Connection validation fails | Existing active connection, if any, remains unchanged | Permanent configuration error; show the missing capability without dumping the AWS response. |
| Optional service or region denied | `partial` with named reduced coverage | Merge successful collectors and preserve last-known data from inaccessible collectors, marked stale/unknown | Retry after policy repair; a complete later sync reconciles deletions. |
| AWS throttling, timeout, or transient 5xx | `retrying`, with attempt and next retry time | Do not publish a failed attempt as a complete snapshot | At least three total attempts with exponential backoff and jitter; exhaust to a visible terminal failure/dead-letter state. IA-205 centralizes the exact policy. |
| Security Hub or Inspector disabled | Source is `success_empty` or unavailable, not a generic scan failure | Other source results remain valid | No automatic retry until configuration changes or the next scheduled scan. |
| Cost Explorer disabled, lagging, or denied | Cost is `partial`, unavailable, or stale with its own timestamp | Inventory and security remain valid | Retry transient errors; permission/configuration failures require customer action. |
| All required collectors succeed with zero resources/findings | Successful empty state | Store a completed snapshot and zero counts | No retry; this is a valid outcome. |
| Worker restart after enqueue or during collection | Job remains queued/retrying; UI keeps the same logical job | No duplicate logical snapshot or finding | Durable worker retry resumes or replays idempotently. |
| Duplicate click, request retry, or scheduler replica race | Existing logical connection/job is returned | No duplicate connection, scan, resource, finding, notification, or cost row | Idempotency key handles the duplicate; record a duplicate-suppression metric. |
| Role revoked after a successful sync | Connection becomes `error` and data becomes stale | Retain last-known records and their observation times; do not present them as current | Customer repairs/redeploys the role and requests validation/sync. |
| Cross-organization access attempt | Forbidden or not found | No data is returned or mutated | No retry; emit a redacted authorization audit event. |

## Idempotency and reconciliation

- A provider connection is unique by organization, provider, and AWS account ID. Pending setup has an opaque connection ID and expiry.
- Connect and update requests accept an idempotency key. Reusing it with the same payload returns the original result; reusing it with a different role ARN is rejected.
- Scan jobs are unique by organization, connection, scan type, and request or scheduled occurrence. Worker retries reuse the same logical scan ID.
- Resources upsert by organization, AWS account, region/scope, type, and provider resource ID. Findings use a stable source/rule/resource fingerprint.
- A fully successful inventory snapshot reconciles deletions. A partial snapshot merges accessible results, preserves inaccessible prior records, and marks their coverage/freshness accurately.
- Notifications are emitted once per logical state transition, not once per delivery attempt.

## Sensitive-data handling and auditability

- Generate the external ID server-side with a cryptographically secure random source. Encrypt it at rest with managed key material because InfraAudit must supply it to STS; show it only when needed for stack setup.
- Store role ARN, AWS account ID, selected regions, capability status, and timestamps. Never store customer AWS access keys for the target flow.
- Keep STS access keys, secret keys, and session tokens in worker memory only for the short role session; never persist or return them.
- Redact external IDs, Authorization headers, access keys, secret keys, session tokens, raw provider error payloads, and customer resource configuration from logs, traces, analytics, notifications, and support exports.
- Audit connection creation, validation, update, sync request, role failure/recovery, and disconnect with actor profile, organization, target account/role, request or job ID, outcome, and time. Do not include secrets.
- The CloudTrail `AssumeRole` event in the customer account is the customer-side record of InfraAudit access. Use a bounded, attributable role-session name that contains no email address or secret.

## Telemetry

Emit structured events for connection validation and each scan lifecycle: `started`, `succeeded`, `partial`, `retrying`, and `failed`. Correlate the HTTP request, connection, organization, scan/job, worker attempt, provider calls, database writes, and resulting findings without high-cardinality secret values.

At minimum, measure:

- onboarding attempts, success rate, validation duration, and failures by safe category;
- time to first inventory and time to complete first value;
- scan queue age, execution duration, attempts, terminal state, and freshness;
- resources and findings by type/source, plus coverage success/denial/unsupported counts;
- AWS throttles, timeouts, permission errors, and stale connections; and
- duplicate connections, jobs, resources, findings, and notifications suppressed.

Alerts must cover stale inventory/finding scans, terminal job failures, queue age, worker/scheduler availability, and unexpected duplicate rates. Customer-facing messages use safe categories and correlation IDs; detailed provider diagnostics remain access-controlled and redacted.

## Update, migration, disconnect, and rollback

### Role update

An owner/admin may validate a replacement role in a pending state while the current connection remains active. InfraAudit switches only after identity and capability validation succeeds. A failed update leaves the current connection and last-known data untouched.

### Static-key migration

1. Label the existing connection `legacy credentials` and restrict migration to an owner/admin.
2. Generate a role-based pending connection for the same organization and AWS account.
3. Validate and run a shadow inventory; compare account identity, coverage, and supported resource counts with the last successful legacy sync.
4. Atomically switch new scans to the role. Do not change historical resource, finding, cost, or job ownership/identifiers.
5. Stop all use of the static credentials, purge the stored secret after customer confirmation, and instruct the AWS operator to deactivate and delete the access key.

Before the atomic switch, rollback discards the pending role and leaves the legacy connection unchanged. After the switch, rollback means selecting another validated role or repairing the previous role; InfraAudit must never silently reactivate a static key. Schema changes remain additive until migration counts, secret deletion, and a restore exercise pass.

### Disconnect

Disconnect immediately stops new role assumptions and scheduled jobs and marks the connection disconnected. The UI instructs the AWS operator to delete the CloudFormation stack. Historical findings, costs, audit events, and scan evidence follow the organization retention policy; inventory is marked historical/stale rather than presented as current. Reconnecting the same account creates a new auditable connection generation without duplicating historical records.

## Acceptance evidence

IA-003 should automate this contract against the disposable IA-002 account. A release candidate is accepted only when the report records:

1. an owner/admin can complete role onboarding and a viewer cannot mutate the connection;
2. another organization cannot read or operate the connection or its outputs;
3. expected fixture resources appear with correct account, region, type, and freshness;
4. known unsafe fixtures produce the expected local/native findings and safe fixtures do not create false positives;
5. empty, disabled-source, partial-permission, throttling/retry, duplicate-request, worker-restart, revoked-role, and complete-reconciliation cases match this document;
6. inventory, findings, compliance, and cost outputs link to the originating scan/job and coverage state;
7. no access key, secret, session token, external ID, or raw sensitive provider payload appears in persistence outside the approved encrypted field, logs, traces, analytics, API responses, or browser storage; and
8. observed timing, error, duplicate, and freshness metrics are captured for IA-004 and summarized in the IA-006 acceptance report.

The evidence bundle contains the smoke-run ID, sanitized timestamps and screenshots/API assertions, job and trace correlation IDs, resource/finding counts, timing measurements, failure injections, and links to the reviewed IAM policy and operator runbook. It must contain no customer secrets.

## Implementation status and handoffs

As of 2026-08-15:

- **Implemented foundation:** owner/admin `manage_providers` RBAC, organization-scoped provider reads/writes, AWS multi-region inventory for the resource types above, partial-inventory merge behavior, local AWS security checks, native Security Hub/Inspector adapters, last-30-day Cost Explorer reads, durable scan workers/scheduler, and scheduler/queue freshness alarms.
- **Known legacy behavior:** the frontend no longer collects new AWS access keys and can download the IA-403 role template, but `POST /api/v1/providers/aws/connect` and connection validation still use static credentials until IA-404; auto-sync after connect is launched from the API process; the sidebar hides the provider-status page from viewers even though backend reads are allowed; disconnect deletes current provider resources; some complete evidence and target telemetry remain unimplemented.
- **IA-401 through IA-407:** define the final least-privilege policy, external-ID lifecycle, CloudFormation role, STS credential provider, capability diagnostics, static-key migration/revocation, and onboarding security tests.
- **IA-002:** create representative safe, unsafe, empty, partial-permission, and revoked-role AWS fixtures.
- **IA-003:** automate the journey and failure matrix with durable job and output assertions.
- **IA-004:** measure and approve or revise the timing, retry, duplicate, and freshness targets.
- **IA-005/IA-006:** classify any remaining partial/demo surfaces and publish the first-customer trust and blind-spot report.

Until the role-onboarding work is complete, static-key onboarding is legacy-only and must not be presented as the golden customer path.
