# RBAC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add role-based access control (owner/admin/viewer) to InfraAudit with both frontend UI gating and backend API enforcement.

**Architecture:** Simple role-string approach using the existing `role` field on the User model. A shared permission map defines what each role can do. Frontend uses a `usePermission()` hook and `<RoleGate>` component to hide/disable UI. Backend Go middleware checks permissions per-route. Only the organization owner can assign roles.

**Tech Stack:** React + TypeScript (frontend), Go (backend), Supabase Auth (JWT), TanStack Query

**Design Doc:** `docs/plans/2026-05-29-rbac-design.md`

---

## Task 1: Add Permission Constants and Types

**Files:**
- Create: `client/src/lib/permissions.ts`

**Step 1: Create the permission constants file**

```typescript
// client/src/lib/permissions.ts

export type Role = 'owner' | 'admin' | 'viewer';

export type Permission =
  | 'view'
  | 'scan'
  | 'manage_providers'
  | 'manage_settings'
  | 'manage_team'
  | 'manage_billing'
  | 'manage_org';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['view', 'scan', 'manage_providers', 'manage_settings', 'manage_team', 'manage_billing', 'manage_org'],
  admin: ['view', 'scan', 'manage_providers', 'manage_settings'],
  viewer: ['view', 'scan'],
};

export const ROLE_HIERARCHY: Role[] = ['owner', 'admin', 'viewer'];

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  const r = (role || 'viewer') as Role;
  const perms = ROLE_PERMISSIONS[r];
  if (!perms) return false;
  return perms.includes(permission);
}

export function isValidRole(role: string): role is Role {
  return ROLE_HIERARCHY.includes(role as Role);
}
```

**Step 2: Update User type to use Role**

Modify `client/src/types/index.ts` line 8 — change `role: string` to import and use the Role type. Keep it as `string` in the interface (backend returns string), but the permission functions handle the cast.

No change needed to the User interface — the `role: string` field is already there and the `hasPermission()` function handles string input.

**Step 3: Commit**

```bash
git add client/src/lib/permissions.ts
git commit -m "feat(rbac): add permission constants and role definitions"
```

---

## Task 2: Create `usePermission()` Hook

**Files:**
- Create: `client/src/hooks/use-permission.ts`

**Step 1: Create the hook**

```typescript
// client/src/hooks/use-permission.ts

import { useAuth } from '@/hooks/use-auth';
import { hasPermission as checkPermission, Permission, Role } from '@/lib/permissions';

export function usePermission() {
  const { user } = useAuth();
  const role = (user?.role || 'viewer') as Role;

  return {
    role,
    hasPermission: (permission: Permission) => checkPermission(role, permission),
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isViewer: role === 'viewer',
  };
}
```

**Step 2: Commit**

```bash
git add client/src/hooks/use-permission.ts
git commit -m "feat(rbac): add usePermission hook"
```

---

## Task 3: Create `<RoleGate>` Component

**Files:**
- Create: `client/src/components/auth/RoleGate.tsx`

**Step 1: Create the component**

```tsx
// client/src/components/auth/RoleGate.tsx

import { ReactNode } from 'react';
import { usePermission } from '@/hooks/use-permission';
import { Permission } from '@/lib/permissions';

interface RoleGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ permission, children, fallback = null }: RoleGateProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add client/src/components/auth/RoleGate.tsx
git commit -m "feat(rbac): add RoleGate component for permission-based UI gating"
```

---

## Task 4: Update `ProtectedRoute` to Support Permission Checks

**Files:**
- Modify: `client/src/lib/protected-route.tsx`

**Step 1: Update ProtectedRoute**

Replace the full content of `client/src/lib/protected-route.tsx`:

```tsx
import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { Permission } from "@/lib/permissions";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  permission?: Permission;
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
}

export function ProtectedRoute({ path, permission, component: Component, children }: ProtectedRouteProps) {
  return (
    <Route
      path={path}
      component={() => {
        const { user, isLoading } = useAuth();
        const { hasPermission } = usePermission();
        const { toast } = useToast();

        const isUnauthorized = !isLoading && user && permission && !hasPermission(permission);

        useEffect(() => {
          if (isUnauthorized) {
            toast({
              title: "Access Denied",
              description: "You don't have permission to access this page.",
              variant: "destructive",
            });
          }
        }, [isUnauthorized, toast]);

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        if (isUnauthorized) {
          return <Redirect to="/dashboard" />;
        }

        if (Component) {
          return <Component />;
        }
        return <>{children}</>;
      }}
    />
  );
}
```

**Step 2: Commit**

```bash
git add client/src/lib/protected-route.tsx
git commit -m "feat(rbac): add permission prop to ProtectedRoute"
```

---

## Task 5: Gate Routes in App.tsx with Permissions

**Files:**
- Modify: `client/src/App.tsx` (lines 106-180)

**Step 1: Add `permission` prop to restricted routes**

Only routes that need gating get the prop. Routes accessible to all authenticated users stay unchanged.

Changes to make in `App.tsx`:

```tsx
// Settings — requires manage_settings
<ProtectedRoute path="/settings" permission="manage_settings">
  <WithTrialCheck><Settings /></WithTrialCheck>
</ProtectedRoute>

// Cloud Providers — requires manage_providers
<ProtectedRoute path="/cloud-providers" permission="manage_providers">
  <WithTrialCheck><CloudProviders /></WithTrialCheck>
</ProtectedRoute>

// Kubernetes — requires manage_providers
<ProtectedRoute path="/kubernetes" permission="manage_providers">
  <WithTrialCheck><KubernetesPage /></WithTrialCheck>
</ProtectedRoute>

// Subscription — requires manage_billing
<ProtectedRoute path="/subscription" permission="manage_billing">
  <WithTrialCheck><SubscriptionPage /></WithTrialCheck>
</ProtectedRoute>
<ProtectedRoute path="/subscription/success" permission="manage_billing">
  <WithTrialCheck><SubscriptionSuccess /></WithTrialCheck>
</ProtectedRoute>
<ProtectedRoute path="/subscription/cancel" permission="manage_billing">
  <WithTrialCheck><SubscriptionCancel /></WithTrialCheck>
</ProtectedRoute>

// Billing Import — requires manage_billing
<ProtectedRoute path="/billing-import" permission="manage_billing">
  <WithTrialCheck><BillingImport /></WithTrialCheck>
</ProtectedRoute>
```

All other ProtectedRoutes (dashboard, security, drift-detection, cost, compliance, automation, etc.) remain unchanged — they only require authentication.

**Step 2: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(rbac): gate restricted routes with permission checks"
```

---

## Task 6: Gate Sidebar Navigation Items

**Files:**
- Modify: `client/src/components/layout/Sidebar.tsx`

**Step 1: Add optional `permission` to NavItem interface and filter items**

Changes to `Sidebar.tsx`:

1. Import RoleGate at the top (line 1 area):
```tsx
import { RoleGate } from "@/components/auth/RoleGate";
import { Permission } from "@/lib/permissions";
```

2. Update NavItem interface (line 38-42):
```tsx
interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    permission?: Permission;
}
```

3. Add permission to restricted nav items in `navGroups` (lines 49-91):
```tsx
// In the "Infrastructure" group:
{ label: "Cloud Providers", href: "/cloud-providers", icon: Cloud, permission: "manage_providers" },
{ label: "Kubernetes", href: "/kubernetes", icon: Cpu, permission: "manage_providers" },

// In bottomNavItems:
{ label: "Settings", href: "/settings", icon: Settings, permission: "manage_settings" },
```

4. Add permission filtering. Import `usePermission` and filter items before rendering. In the `Sidebar` component function, add at the top:

```tsx
const { hasPermission } = usePermission();

// Filter function
const filterByPermission = (items: NavItem[]) =>
    items.filter(item => !item.permission || hasPermission(item.permission));
```

Then use `filterByPermission(group.items)` instead of `group.items` in both collapsed and expanded views, and `filterByPermission(bottomNavItems)` for bottom nav.

**Step 2: Commit**

```bash
git add client/src/components/layout/Sidebar.tsx
git commit -m "feat(rbac): hide sidebar items based on user permissions"
```

---

## Task 7: Gate Team Management Section in Settings

**Files:**
- Modify: `client/src/pages/Settings.tsx` (lines 604-672)

**Step 1: Gate team management controls**

The Settings page has a "Team & Access" tab. We need to:

1. Import `usePermission` at the top:
```tsx
import { usePermission } from "@/hooks/use-permission";
```

2. In the component body, add:
```tsx
const { hasPermission, isOwner } = usePermission();
```

3. Update the invite role options (lines 617-619) to use correct role names:
```tsx
<SelectItem value="admin">Admin</SelectItem>
<SelectItem value="viewer">Viewer</SelectItem>
```
Remove the "Editor" option. Remove the "Admin" option if the current user is not an owner.

4. Wrap the invite section (lines 611-630) and the role change/remove controls (lines 647-665) with an owner-only check:
```tsx
{isOwner && (
  // Invite section + role change select + remove button
)}
```

5. For the team member role dropdown (line 647-654), disable it if the user is not an owner:
```tsx
<Select
  value={m.role}
  onValueChange={(v) => updateRoleMutation.mutate({ id: m.id, role: v })}
  disabled={!isOwner}
>
```

6. Hide the "Team & Access" tab trigger entirely for viewers (they have no team permissions). Wrap the TabsTrigger for "team" tab:
```tsx
{hasPermission('manage_team') && (
  <TabsTrigger value="team" ...>Team & Access</TabsTrigger>
)}
```

**Step 2: Commit**

```bash
git add client/src/pages/Settings.tsx
git commit -m "feat(rbac): restrict team management to owner role"
```

---

## Task 8: Add Subscription/Billing Page Gating

**Files:**
- Modify: `client/src/components/layout/Navbar.tsx` (if subscription link exists in user dropdown)

**Step 1: Gate billing-related links in Navbar**

In `Navbar.tsx`, find the user dropdown menu links. Wrap the subscription/billing link with RoleGate:

```tsx
<RoleGate permission="manage_billing">
  <Link href="/subscription">Subscription</Link>
</RoleGate>
```

**Step 2: Commit**

```bash
git add client/src/components/layout/Navbar.tsx
git commit -m "feat(rbac): hide billing link in navbar for non-owners"
```

---

## Task 9: Update Profile Page Role Badge

**Files:**
- Modify: `client/src/pages/Profile.tsx` (line 40)

**Step 1: Fix role badge default**

Change line 40 from:
```tsx
<Badge variant="secondary" className="capitalize">{user.role || "admin"}</Badge>
```
to:
```tsx
<Badge variant="secondary" className="capitalize">{user.role || "viewer"}</Badge>
```

New users should default to `viewer`, not `admin`.

**Step 2: Commit**

```bash
git add client/src/pages/Profile.tsx
git commit -m "fix(rbac): default role display to viewer instead of admin"
```

---

## Task 10: Backend — Add RBAC Middleware (Go)

> **Note:** The Go backend is not in this repository. These are the specifications for the backend changes. Apply them to the Go backend repo.

**Files:**
- Create: `internal/middleware/rbac.go` (or equivalent path in Go backend)
- Modify: Route registration file

**Step 1: Create permission map in Go**

```go
// internal/middleware/rbac.go
package middleware

import (
    "net/http"
)

var rolePermissions = map[string][]string{
    "owner":  {"view", "scan", "manage_providers", "manage_settings", "manage_team", "manage_billing", "manage_org"},
    "admin":  {"view", "scan", "manage_providers", "manage_settings"},
    "viewer": {"view", "scan"},
}

func HasPermission(role, permission string) bool {
    perms, ok := rolePermissions[role]
    if !ok {
        return false
    }
    for _, p := range perms {
        if p == permission {
            return true
        }
    }
    return false
}
```

**Step 2: Create middleware function**

```go
func RequirePermission(permission string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Get user from context (set by auth middleware)
            user := getUserFromContext(r.Context())
            if user == nil {
                http.Error(w, `{"success":false,"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}`, 401)
                return
            }

            if !HasPermission(user.Role, permission) {
                http.Error(w, `{"success":false,"error":{"code":"FORBIDDEN","message":"You don't have permission to perform this action"}}`, 403)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}
```

**Step 3: Apply middleware to routes**

```go
// Provider routes — manage_providers
api.Handle("POST /providers", RequirePermission("manage_providers")(providerHandler))
api.Handle("PUT /providers/{id}", RequirePermission("manage_providers")(providerHandler))
api.Handle("DELETE /providers/{id}", RequirePermission("manage_providers")(providerHandler))

// Settings routes — manage_settings
api.Handle("PUT /settings", RequirePermission("manage_settings")(settingsHandler))

// Team routes — manage_team
api.Handle("POST /settings/team", RequirePermission("manage_team")(teamHandler))
api.Handle("PUT /settings/team/{id}", RequirePermission("manage_team")(teamHandler))
api.Handle("DELETE /settings/team/{id}", RequirePermission("manage_team")(teamHandler))

// Billing routes — manage_billing
api.Handle("POST /subscription", RequirePermission("manage_billing")(billingHandler))
```

**Step 4: Commit**

```bash
git add internal/middleware/rbac.go
git commit -m "feat(rbac): add backend permission middleware"
```

---

## Task 11: Backend — Role Assignment Endpoint

**Files:**
- Modify: Team handler in Go backend

**Step 1: Update team role assignment**

The `PUT /settings/team/{id}` endpoint should:

1. Only allow `owner` to change roles (enforced by `manage_team` middleware)
2. Validate the target role is `admin` or `viewer` — reject `owner`
3. Prevent the owner from changing their own role
4. Update the user's `role` field in the database

```go
func handleUpdateTeamRole(w http.ResponseWriter, r *http.Request) {
    currentUser := getUserFromContext(r.Context())
    targetID := getPathParam(r, "id")

    var body struct {
        Role string `json:"role"`
    }
    json.NewDecoder(r.Body).Decode(&body)

    // Validate role
    if body.Role != "admin" && body.Role != "viewer" {
        // Return 400: "Role must be 'admin' or 'viewer'"
        return
    }

    // Prevent owner from changing own role
    if fmt.Sprint(currentUser.ID) == targetID {
        // Return 400: "Cannot change your own role"
        return
    }

    // Update in database
    // UPDATE users SET role = $1 WHERE id = $2
}
```

**Step 2: Commit**

```bash
git commit -m "feat(rbac): add role validation to team role assignment endpoint"
```

---

## Task 12: Frontend Error Handling for 403 Responses

**Files:**
- Modify: `client/src/lib/queryClient.ts`

**Step 1: Handle 403 in the API request function**

In `queryClient.ts`, in the `apiRequest` function or the default query function, add handling for 403 responses. When a 403 is received, show a toast notification:

```typescript
if (res.status === 403) {
  throw new Error("You don't have permission to perform this action");
}
```

The existing error handling in TanStack Query mutation `onError` callbacks will surface this to the user.

**Step 2: Commit**

```bash
git add client/src/lib/queryClient.ts
git commit -m "feat(rbac): handle 403 forbidden responses in API client"
```

---

## Task 13: Verify and Test

**Step 1: Manual verification checklist**

Test with each role by setting the user's `role` field in the database:

- [ ] **Viewer login:** Can see dashboard, security, cost, compliance pages. Can trigger scans. Cannot see Settings, Cloud Providers, Subscription in sidebar. Navigating to `/settings` directly redirects to `/dashboard` with toast.
- [ ] **Admin login:** Same as viewer + can see Settings, Cloud Providers. Cannot see Subscription in sidebar or navbar. Team tab not visible in Settings. Cannot invite or remove members.
- [ ] **Owner login:** Full access. Can see Team tab, invite members, change roles, manage billing.
- [ ] **403 test:** As viewer, use browser devtools to call a settings API endpoint directly — verify 403 response.
- [ ] **Role badge:** Profile page shows correct role for each user type.

**Step 2: Commit any fixes**

```bash
git commit -m "fix(rbac): address issues found during testing"
```

---

## Summary of Changes

| # | Task | Files | Scope |
|---|------|-------|-------|
| 1 | Permission constants | `client/src/lib/permissions.ts` (new) | Frontend |
| 2 | usePermission hook | `client/src/hooks/use-permission.ts` (new) | Frontend |
| 3 | RoleGate component | `client/src/components/auth/RoleGate.tsx` (new) | Frontend |
| 4 | ProtectedRoute update | `client/src/lib/protected-route.tsx` | Frontend |
| 5 | Route gating | `client/src/App.tsx` | Frontend |
| 6 | Sidebar gating | `client/src/components/layout/Sidebar.tsx` | Frontend |
| 7 | Team management gating | `client/src/pages/Settings.tsx` | Frontend |
| 8 | Navbar billing gating | `client/src/components/layout/Navbar.tsx` | Frontend |
| 9 | Profile role badge fix | `client/src/pages/Profile.tsx` | Frontend |
| 10 | RBAC middleware | `internal/middleware/rbac.go` (new) | Backend |
| 11 | Role assignment validation | Team handler | Backend |
| 12 | 403 error handling | `client/src/lib/queryClient.ts` | Frontend |
| 13 | Manual verification | — | Testing |
