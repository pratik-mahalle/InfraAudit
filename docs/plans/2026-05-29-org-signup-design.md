# Organization Signup & Invite Design

**Date:** 2026-05-29
**Status:** Approved

---

## Goal

Add organization support to the signup flow so users can create or join an org during registration. Organization creators become `owner` with full access. Invited members join with the role the owner assigned.

---

## Signup Flow

### Step 1 (unchanged)
Standard signup — OAuth (Google/GitHub) or email/password form.

### Step 2 (new — shown after account creation)
Org setup screen replaces the dashboard redirect. Two options:

**Create Organization**
- Input: organization name (required)
- On submit: creates org record, sets `user.role = owner`, sets `user.organization_id`
- Redirects to `/dashboard`

**Join Organization**
- Only shown when user arrived via an invite link (`/signup?invite=:token`)
- Auto-populates org name from token (read-only)
- On confirm: accepts invite, sets role from token, sets `organization_id`
- Redirects to `/dashboard`

**Default / Skip**
- Everyone gets `role = owner` by default (personal workspace)
- Can create/join an org later from Settings

---

## Invite Flow

### Owner side (Settings > Team tab)
1. Owner enters invitee email + role (admin/viewer) → Invite
2. Backend generates unique token, stores in `team_invites` table
3. Backend sends email with link: `{APP_URL}/invite/:token`
4. Team list shows invitee with "Pending" status badge

### Invitee side
1. Clicks link → lands on `/invite/:token`
2. Page shows: org name, assigned role, Accept button
3. **Not logged in:** redirect to `/signup?invite=:token` → after signup, auto-join
4. **Already logged in:** accept screen, one-click join → `/dashboard`
5. Token expires in 7 days. Invalid/expired tokens show error.

---

## Database Changes (Backend)

### New table: `organizations`
```sql
CREATE TABLE organizations (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  owner_user_id  BIGINT NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### New table: `team_invites`
```sql
CREATE TABLE team_invites (
  id             BIGSERIAL PRIMARY KEY,
  token          TEXT NOT NULL UNIQUE,
  org_id         BIGINT NOT NULL REFERENCES organizations(id),
  invitee_email  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'viewer',
  expires_at     TIMESTAMPTZ NOT NULL,
  accepted_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### Updated table: `profiles`
- Add `organization_id BIGINT REFERENCES organizations(id)` (nullable)
- `role` column default changes from `user` to `owner`

---

## New Backend Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/organizations` | authenticated | Create org, set caller as owner |
| GET | `/api/invite/:token` | public | Get invite details (org name, role) |
| POST | `/api/invite/:token/accept` | authenticated | Accept invite, join org |

### Existing endpoint changes
- `POST /api/settings/team` — now sends invite email instead of just inserting DB row
- Team list shows `status: "pending"` for unaccepted invites

---

## Frontend Changes

### New files
- `client/src/pages/InvitePage.tsx` — `/invite/:token` public page
- `client/src/components/signup/OrgSetupStep.tsx` — Step 2 of signup

### Modified files
- `client/src/pages/signup-page.tsx` — Add Step 2 (org setup) after successful email signup
- `client/src/hooks/use-auth.tsx` — `signUpWithEmail` accepts `inviteToken` param; after OAuth signup redirect to `/signup?step=org`
- `client/src/pages/Settings.tsx` — Team invite sends email (via updated API), shows Pending badge, adds Resend option
- `client/src/components/layout/Navbar.tsx` — Show org name in user dropdown
- `client/src/pages/Profile.tsx` — Show organization name + role
- `client/src/App.tsx` — Add `/invite/:token` public route

---

## Key Decisions

1. **Everyone defaults to owner** — simplest trust model, no limbo state for new users
2. **Email invite only** — no invite codes, cleaner UX
3. **7-day token expiry** — standard for invite links
4. **Two-step signup** — keeps the initial signup form clean, org setup is a separate concern
5. **Invite token in URL** — `/signup?invite=:token` preserves token through the signup flow
