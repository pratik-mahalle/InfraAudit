# Role-Based Access Control (RBAC) Design

**Date:** 2026-05-29
**Status:** Approved
**Approach:** Simple Role String (Approach 1) — use existing `role` field on User model

---

## Roles

Three-tier hierarchical roles stored as a string in the existing `role` field:

| Role | Description |
|------|-------------|
| `owner` | Full control. One per organization. Manages team, billing, and org. |
| `admin` | Operational control. Manages providers and settings. No team/billing access. |
| `viewer` | Read-only access. Can trigger scans and automations. |

Role assignment is **owner-only** — only the organization owner can assign or change roles.

---

## Permission Map

Shared constant used by both frontend (TypeScript) and backend (Go):

```
owner:  view, scan, manage_providers, manage_settings, manage_team, manage_billing, manage_org
admin:  view, scan, manage_providers, manage_settings
viewer: view, scan
```

### Permission-to-Feature Mapping

| Permission | Features / Routes |
|---|---|
| `view` | Dashboard, Security, Drift Detection, Vulnerabilities, Cost, Cost Prediction, Compliance, Resources, Recommendations, Reports, AI Demo, Architecture Playground, Profile |
| `scan` | Trigger scans, run automations, trigger drift detection |
| `manage_providers` | Cloud Providers (add/edit/delete), Kubernetes config |
| `manage_settings` | Settings (alerts, Slack, notifications, preferences) |
| `manage_team` | Invite users, assign roles, remove team members |
| `manage_billing` | Subscription page, billing import, plan changes |
| `manage_org` | Delete organization, transfer ownership |

---

## Frontend Implementation

Enforcement at both UI and route level.

### `usePermission()` Hook

New hook in `client/src/hooks/use-permission.ts`:
- Reads `role` from existing `useAuth()` context
- Exposes: `hasPermission(permission)`, `role`, `isOwner`, `isAdmin`, `isViewer`

### `<RoleGate>` Component

Wrapper component that conditionally renders children based on permission:

```tsx
<RoleGate permission="manage_settings">
  <NavItem to="/settings">Settings</NavItem>
</RoleGate>
```

If the user lacks the permission, children are not rendered.

### Protected Route Enhancement

Update `protected-route.tsx` to accept an optional `permission` prop:

```tsx
<ProtectedRoute permission="manage_billing">
  <SubscriptionPage />
</ProtectedRoute>
```

Unauthorized users are redirected to `/dashboard` with a toast notification.

### Navigation Changes

Sidebar nav items wrapped with `<RoleGate>`:
- Settings -> `manage_settings`
- Cloud Providers -> `manage_providers`
- Subscription/Billing -> `manage_billing`
- Team Management (new page) -> `manage_team`

### Profile Page

Role badge already exists — update to reflect actual role instead of defaulting to "admin".

---

## Backend Implementation

Enforcement via Go middleware on API routes.

### RBAC Middleware

New middleware `RequirePermission(permission)` that:
1. Extracts role from authenticated user record
2. Checks role against permission map
3. Returns 403 if unauthorized

### Route Protection

```
# All authenticated users (view + scan)
GET  /api/dashboard/*         — no permission check (auth only)
POST /api/scan                — no permission check (auth only)
POST /api/automation          — no permission check (auth only)

# Admin + Owner
POST   /api/providers         — manage_providers
PUT    /api/providers/:id     — manage_providers
DELETE /api/providers/:id     — manage_providers
PUT    /api/settings          — manage_settings

# Owner only
POST /api/team/invite         — manage_team
PUT  /api/team/:id/role       — manage_team
DELETE /api/team/:id          — manage_team
POST /api/subscription        — manage_billing
```

### Role Assignment Endpoint

`PUT /api/team/:id/role`:
- Owner-only access
- Validates target role is `admin` or `viewer` (cannot create another owner)
- Updates user's `role` field in database

### 403 Response Format

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action"
  }
}
```

---

## Key Decisions

1. **Simple string role** over permissions table — 3 fixed roles don't need the complexity
2. **Both frontend + backend enforcement** — UI hides elements, API rejects unauthorized requests
3. **Owner-only role management** — simplest trust model
4. **No Supabase RLS** — Go backend handles all API logic, RLS would add complexity without coverage
5. **Viewers can scan** — scans and automations are available to all roles
