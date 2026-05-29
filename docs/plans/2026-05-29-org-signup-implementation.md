# Organization Signup & Invite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add org creation/joining to signup and a token-based email invite flow.

**Architecture:** Two-step signup (auth form → org setup), `organizations` + `team_invites` DB tables, 3 new backend endpoints, frontend OrgSetupStep + InvitePage components.

**Tech Stack:** Go (chi/v5, database/sql, postgres), React + TypeScript (Wouter, TanStack Query, Radix UI), Supabase Auth

---

### Task 1: Backend — DB Migration

**Files:**
- Create: `infraudit-go/migrations/YYYYMMDD_add_organizations.sql`

**Step 1: Write the migration**

```sql
-- migrations/YYYYMMDD_add_organizations.sql

CREATE TABLE organizations (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  owner_user_id  BIGINT NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE profiles
  ADD COLUMN organization_id BIGINT REFERENCES organizations(id),
  ALTER COLUMN role SET DEFAULT 'owner';
```

**Step 2: Run the migration against your DB**

```bash
psql $DATABASE_URL -f migrations/YYYYMMDD_add_organizations.sql
```

Expected: no errors, `\dt` shows `organizations` and `team_invites`.

**Step 3: Commit**

```bash
git add migrations/
git commit -m "feat: add organizations, team_invites tables, organization_id on profiles"
```

---

### Task 2: Backend — Organization domain model + repository

**Files:**
- Create: `infraudit-go/internal/domain/org/model.go`
- Create: `infraudit-go/internal/domain/org/repository.go`
- Create: `infraudit-go/internal/repository/postgres/org.go`

**Step 1: Write the failing test**

```go
// infraudit-go/internal/repository/postgres/org_test.go
func TestCreateOrg(t *testing.T) {
    db := testutil.NewTestDB(t)
    repo := NewOrgRepository(db)
    org, err := repo.Create(context.Background(), "Acme Corp", 1)
    require.NoError(t, err)
    assert.NotZero(t, org.ID)
    assert.Equal(t, "Acme Corp", org.Name)
    assert.Equal(t, int64(1), org.OwnerUserID)
}

func TestGetInviteByToken(t *testing.T) {
    // setup org + invite in DB, then GetByToken
}
```

**Step 2: Run to confirm failure**

```bash
go test ./internal/repository/postgres/... -run TestCreateOrg -v
```

**Step 3: Write model**

```go
// internal/domain/org/model.go
package org

import "time"

type Organization struct {
    ID          int64     `json:"id"`
    Name        string    `json:"name"`
    OwnerUserID int64     `json:"owner_user_id"`
    CreatedAt   time.Time `json:"created_at"`
}

type TeamInvite struct {
    ID           int64      `json:"id"`
    Token        string     `json:"token"`
    OrgID        int64      `json:"org_id"`
    OrgName      string     `json:"org_name"`
    InviteeEmail string     `json:"invitee_email"`
    Role         string     `json:"role"`
    ExpiresAt    time.Time  `json:"expires_at"`
    AcceptedAt   *time.Time `json:"accepted_at,omitempty"`
}
```

**Step 4: Write repository interface**

```go
// internal/domain/org/repository.go
package org

import "context"

type Repository interface {
    Create(ctx context.Context, name string, ownerUserID int64) (*Organization, error)
    GetByID(ctx context.Context, id int64) (*Organization, error)
    CreateInvite(ctx context.Context, invite *TeamInvite) error
    GetInviteByToken(ctx context.Context, token string) (*TeamInvite, error)
    AcceptInvite(ctx context.Context, token string, userID int64, orgID int64) error
}
```

**Step 5: Write postgres implementation**

```go
// internal/repository/postgres/org.go
package postgres

import (
    "context"
    "database/sql"
    "time"
    "github.com/pratik-mahalle/infraudit/internal/domain/org"
)

type OrgRepository struct{ db *sql.DB }

func NewOrgRepository(db *sql.DB) org.Repository {
    return &OrgRepository{db: db}
}

func (r *OrgRepository) Create(ctx context.Context, name string, ownerUserID int64) (*org.Organization, error) {
    o := &org.Organization{Name: name, OwnerUserID: ownerUserID}
    err := r.db.QueryRowContext(ctx,
        `INSERT INTO organizations (name, owner_user_id) VALUES ($1, $2) RETURNING id, created_at`,
        name, ownerUserID,
    ).Scan(&o.ID, &o.CreatedAt)
    return o, err
}

func (r *OrgRepository) GetByID(ctx context.Context, id int64) (*org.Organization, error) {
    o := &org.Organization{}
    err := r.db.QueryRowContext(ctx,
        `SELECT id, name, owner_user_id, created_at FROM organizations WHERE id = $1`, id,
    ).Scan(&o.ID, &o.Name, &o.OwnerUserID, &o.CreatedAt)
    return o, err
}

func (r *OrgRepository) CreateInvite(ctx context.Context, inv *org.TeamInvite) error {
    return r.db.QueryRowContext(ctx,
        `INSERT INTO team_invites (token, org_id, invitee_email, role, expires_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        inv.Token, inv.OrgID, inv.InviteeEmail, inv.Role, inv.ExpiresAt,
    ).Scan(&inv.ID)
}

func (r *OrgRepository) GetInviteByToken(ctx context.Context, token string) (*org.TeamInvite, error) {
    inv := &org.TeamInvite{}
    err := r.db.QueryRowContext(ctx,
        `SELECT ti.id, ti.token, ti.org_id, o.name, ti.invitee_email, ti.role, ti.expires_at, ti.accepted_at
         FROM team_invites ti JOIN organizations o ON o.id = ti.org_id
         WHERE ti.token = $1`, token,
    ).Scan(&inv.ID, &inv.Token, &inv.OrgID, &inv.OrgName, &inv.InviteeEmail, &inv.Role, &inv.ExpiresAt, &inv.AcceptedAt)
    return inv, err
}

func (r *OrgRepository) AcceptInvite(ctx context.Context, token string, userID int64, orgID int64) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    _, err = tx.ExecContext(ctx,
        `UPDATE team_invites SET accepted_at = $1 WHERE token = $2`, time.Now(), token)
    if err != nil {
        return err
    }
    _, err = tx.ExecContext(ctx,
        `UPDATE profiles SET organization_id = $1 WHERE id = $2`, orgID, userID)
    if err != nil {
        return err
    }
    return tx.Commit()
}
```

**Step 6: Run tests**

```bash
/usr/local/go/bin/go test -C /Users/pratikmahalle/code/Infra/infraudit-go ./internal/repository/postgres/... -v
```

**Step 7: Commit**

```bash
git add internal/domain/org/ internal/repository/postgres/org.go
git commit -m "feat: add org domain model and postgres repository"
```

---

### Task 3: Backend — POST /api/organizations endpoint

**Files:**
- Create: `infraudit-go/internal/api/handlers/org.go`
- Modify: `infraudit-go/internal/api/router/router.go`
- Modify: `infraudit-go/cmd/api/main.go`

**Step 1: Write the handler**

```go
// internal/api/handlers/org.go
package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"

    "github.com/pratik-mahalle/infraudit/internal/api/middleware"
    "github.com/pratik-mahalle/infraudit/internal/domain/org"
    "github.com/pratik-mahalle/infraudit/internal/pkg/errors"
    "github.com/pratik-mahalle/infraudit/internal/pkg/logger"
    "github.com/pratik-mahalle/infraudit/internal/pkg/utils"
    "github.com/pratik-mahalle/infraudit/internal/repository/postgres"
)

type OrgHandler struct {
    orgRepo org.Repository
    db      *sql.DB
    logger  *logger.Logger
}

func NewOrgHandler(db *sql.DB, log *logger.Logger) *OrgHandler {
    return &OrgHandler{
        orgRepo: postgres.NewOrgRepository(db),
        db:      db,
        logger:  log,
    }
}

type createOrgRequest struct {
    Name string `json:"name"`
}

// CreateOrg handles POST /api/organizations
func (h *OrgHandler) CreateOrg(w http.ResponseWriter, r *http.Request) {
    userID, ok := middleware.GetUserID(r)
    if !ok {
        utils.WriteError(w, errors.Unauthorized("Not authenticated"))
        return
    }

    var req createOrgRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
        utils.WriteError(w, errors.BadRequest("Organization name is required"))
        return
    }

    o, err := h.orgRepo.Create(r.Context(), req.Name, userID)
    if err != nil {
        h.logger.WithError(err).Error("Failed to create organization")
        utils.WriteError(w, errors.Internal("Failed to create organization", err))
        return
    }

    // Set organization_id on the creator's profile
    _, err = h.db.ExecContext(r.Context(),
        `UPDATE profiles SET organization_id = $1 WHERE id = $2`, o.ID, userID)
    if err != nil {
        h.logger.WithError(err).Error("Failed to set organization_id on profile")
        utils.WriteError(w, errors.Internal("Failed to update profile", err))
        return
    }

    utils.WriteSuccess(w, http.StatusCreated, o)
}
```

**Step 2: Wire in router and main**

In `router.go`, inside the authenticated group:
```go
orgHandler := handlers.NewOrgHandler(db, log)
r.Post("/api/organizations", orgHandler.CreateOrg)
```

In `cmd/api/main.go`, pass `db` and `log` to `NewOrgHandler` (it creates its own repo internally).

**Step 3: Build**

```bash
/usr/local/go/bin/go build -C /Users/pratikmahalle/code/Infra/infraudit-go ./...
```

Expected: no errors.

**Step 4: Commit**

```bash
git add internal/api/handlers/org.go internal/api/router/router.go cmd/api/main.go
git commit -m "feat: add POST /api/organizations endpoint"
```

---

### Task 4: Backend — GET + POST /api/invite/:token endpoints

**Files:**
- Modify: `infraudit-go/internal/api/handlers/org.go`
- Modify: `infraudit-go/internal/api/router/router.go`

**Step 1: Add invite handlers to org.go**

```go
// GetInvite handles GET /api/invite/:token (public)
func (h *OrgHandler) GetInvite(w http.ResponseWriter, r *http.Request) {
    token := chi.URLParam(r, "token")
    inv, err := h.orgRepo.GetInviteByToken(r.Context(), token)
    if err != nil {
        utils.WriteError(w, errors.NotFound("Invite"))
        return
    }
    if inv.AcceptedAt != nil {
        utils.WriteError(w, errors.BadRequest("Invite already accepted"))
        return
    }
    if time.Now().After(inv.ExpiresAt) {
        utils.WriteError(w, errors.BadRequest("Invite has expired"))
        return
    }
    utils.WriteSuccess(w, http.StatusOK, map[string]any{
        "org_name": inv.OrgName,
        "role":     inv.Role,
        "email":    inv.InviteeEmail,
    })
}

// AcceptInvite handles POST /api/invite/:token/accept (authenticated)
func (h *OrgHandler) AcceptInvite(w http.ResponseWriter, r *http.Request) {
    userID, ok := middleware.GetUserID(r)
    if !ok {
        utils.WriteError(w, errors.Unauthorized("Not authenticated"))
        return
    }

    token := chi.URLParam(r, "token")
    inv, err := h.orgRepo.GetInviteByToken(r.Context(), token)
    if err != nil {
        utils.WriteError(w, errors.NotFound("Invite"))
        return
    }
    if inv.AcceptedAt != nil {
        utils.WriteError(w, errors.BadRequest("Invite already accepted"))
        return
    }
    if time.Now().After(inv.ExpiresAt) {
        utils.WriteError(w, errors.BadRequest("Invite has expired"))
        return
    }

    // Set invited role on profile + link org
    _, err = h.db.ExecContext(r.Context(),
        `UPDATE profiles SET organization_id = $1, role = $2 WHERE id = $3`,
        inv.OrgID, inv.Role, userID)
    if err != nil {
        utils.WriteError(w, errors.Internal("Failed to update profile", err))
        return
    }

    if err := h.orgRepo.AcceptInvite(r.Context(), token, userID, inv.OrgID); err != nil {
        utils.WriteError(w, errors.Internal("Failed to accept invite", err))
        return
    }

    utils.WriteSuccessWithMessage(w, http.StatusOK, "Joined organization", nil)
}
```

**Step 2: Wire routes in router.go**

```go
// Public route (no auth required):
r.Get("/api/invite/{token}", orgHandler.GetInvite)

// Authenticated route:
r.Post("/api/invite/{token}/accept", orgHandler.AcceptInvite)
```

**Step 3: Build**

```bash
/usr/local/go/bin/go build -C /Users/pratikmahalle/code/Infra/infraudit-go ./...
```

**Step 4: Commit**

```bash
git add internal/api/handlers/org.go internal/api/router/router.go
git commit -m "feat: add GET/POST /api/invite/:token endpoints"
```

---

### Task 5: Backend — Update settings invite to use token + email

**Files:**
- Modify: `infraudit-go/internal/api/handlers/settings.go`

The current `InviteTeamMember` inserts into `team_members`. Update it to also generate a token, insert into `team_invites`, and send an email (stub for now if no email service exists).

**Step 1: Update InviteTeamMember**

Add imports: `crypto/rand`, `encoding/hex`, `time`, plus the org repo.

Add to `SettingsHandler` struct:
```go
orgRepo org.Repository
```

Update constructor:
```go
func NewSettingsHandler(db *sql.DB, log *logger.Logger) *SettingsHandler {
    return &SettingsHandler{db: db, logger: log, orgRepo: postgres.NewOrgRepository(db)}
}
```

In `InviteTeamMember`, after inserting to `team_members`, generate token and insert to `team_invites`:

```go
// Get the owner's org_id
var orgID sql.NullInt64
h.db.QueryRowContext(r.Context(),
    `SELECT organization_id FROM profiles WHERE id = $1`, uid).Scan(&orgID)

if orgID.Valid {
    // Generate invite token
    rawBytes := make([]byte, 16)
    rand.Read(rawBytes)
    token := hex.EncodeToString(rawBytes)

    inv := &org.TeamInvite{
        Token:        token,
        OrgID:        orgID.Int64,
        InviteeEmail: req.Email,
        Role:         req.Role,
        ExpiresAt:    time.Now().Add(7 * 24 * time.Hour),
    }
    if err := h.orgRepo.CreateInvite(r.Context(), inv); err != nil {
        h.logger.WithError(err).Warn("Failed to create team invite token")
    } else {
        // TODO: send email with link: APP_URL/invite/:token
        h.logger.WithFields(map[string]interface{}{
            "token": token,
            "email": req.Email,
        }).Info("Invite token created — email sending not yet wired")
    }
}
```

**Step 2: Build**

```bash
/usr/local/go/bin/go build -C /Users/pratikmahalle/code/Infra/infraudit-go ./...
```

**Step 3: Commit**

```bash
git add internal/api/handlers/settings.go
git commit -m "feat: generate invite token in team invite, stub email send"
```

---

### Task 6: Backend — Default new users to role=owner

**Files:**
- Modify: `infraudit-go/internal/services/user_service.go`

**Step 1: Change EnsureProfile default role**

```go
// Change line:
Role: user.RoleUser,
// To:
Role: user.RoleOwner,
```

**Step 2: Build**

```bash
/usr/local/go/bin/go build -C /Users/pratikmahalle/code/Infra/infraudit-go ./...
```

**Step 3: Commit**

```bash
git add internal/services/user_service.go
git commit -m "fix: default new user role to owner instead of user"
```

---

### Task 7: Backend — Add org fields to UserDTO

**Files:**
- Modify: `infraudit-go/internal/api/dto/user.go`
- Modify: `infraudit-go/internal/api/handlers/auth.go`

**Step 1: Update UserDTO**

```go
type UserDTO struct {
    ID             int64   `json:"id"`
    Email          string  `json:"email"`
    Username       string  `json:"username,omitempty"`
    FullName       *string `json:"full_name,omitempty"`
    AvatarURL      string  `json:"avatar_url,omitempty"`
    JobTitle       string  `json:"job_title,omitempty"`
    Company        string  `json:"company,omitempty"`
    Role           string  `json:"role"`
    PlanType       string  `json:"plan_type"`
    OrganizationID *int64  `json:"organization_id,omitempty"`
    OrgName        *string `json:"org_name,omitempty"`
}
```

**Step 2: Update Me handler in auth.go to populate org fields**

In the handler that builds UserDTO from the user struct, add a query to fetch org name if `organization_id` is set. Add `OrganizationID` and `OrgName` to the `user.User` struct (or query it inline in the handler).

Simplest approach — query org name inline in the `Me` handler after building the DTO:

```go
if u.OrganizationID != nil {
    var orgName string
    if err := h.db.QueryRowContext(r.Context(),
        `SELECT name FROM organizations WHERE id = $1`, *u.OrganizationID,
    ).Scan(&orgName); err == nil {
        dto.OrgName = &orgName
    }
    dto.OrganizationID = u.OrganizationID
}
```

This requires `OrganizationID *int64` to be added to `user.User` model and populated in the postgres `GetByAuthID` query.

**Step 3: Update user.User model**

In `internal/domain/user/model.go`, add:
```go
OrganizationID *int64 `json:"organization_id,omitempty"`
```

**Step 4: Update postgres GetByAuthID / GetByID queries**

In `internal/repository/postgres/user.go`, add `organization_id` to the SELECT and scan it into the new field.

**Step 5: Build**

```bash
/usr/local/go/bin/go build -C /Users/pratikmahalle/code/Infra/infraudit-go ./...
```

**Step 6: Commit**

```bash
git add internal/domain/user/model.go internal/api/dto/user.go internal/api/handlers/auth.go internal/repository/postgres/user.go
git commit -m "feat: expose organization_id and org_name in user API response"
```

---

### Task 8: Frontend — OrgSetupStep component

**Files:**
- Create: `client/src/components/auth/OrgSetupStep.tsx`

**Step 1: Create component**

```tsx
// client/src/components/auth/OrgSetupStep.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Users } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface Props {
  accessToken: string;
  inviteToken?: string; // present when user came via /signup?invite=:token
  onComplete: () => void;
}

export function OrgSetupStep({ accessToken, inviteToken, onComplete }: Props) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(
    inviteToken ? 'join' : 'choose'
  );
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteDetails, setInviteDetails] = useState<{org_name: string; role: string} | null>(null);

  // Load invite details when mode=join
  useState(() => {
    if (inviteToken) {
      fetch(`${API_BASE}/api/invite/${inviteToken}`)
        .then(r => r.json())
        .then(json => setInviteDetails(json.data))
        .catch(() => setError('Invalid or expired invite link'));
    }
  });

  const handleCreate = async () => {
    if (!orgName.trim()) { setError('Organization name is required'); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: orgName }),
      });
      if (!res.ok) throw new Error('Failed to create organization');
      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/invite/${inviteToken}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to accept invite');
      onComplete();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Set up your organization</h2>
        <p className="text-sm text-gray-500">You can always do this later from Settings.</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button className="w-full" onClick={() => setMode('create')}>
          <Building2 className="mr-2 h-4 w-4" /> Create Organization
        </Button>
        <Button variant="outline" className="w-full" onClick={onComplete}>
          Skip for now
        </Button>
      </div>
    );
  }

  if (mode === 'join' && inviteToken) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Join Organization</h2>
        {inviteDetails ? (
          <>
            <p className="text-sm text-gray-600">
              You've been invited to join <strong>{inviteDetails.org_name}</strong> as <strong>{inviteDetails.role}</strong>.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" onClick={handleJoin} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Accept & Join
            </Button>
            <Button variant="ghost" className="w-full" onClick={onComplete}>Skip</Button>
          </>
        ) : error ? (
          <>
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" className="w-full" onClick={onComplete}>Continue without joining</Button>
          </>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        )}
      </div>
    );
  }

  // mode === 'create'
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Create Organization</h2>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <Label htmlFor="orgName">Organization Name</Label>
        <Input
          id="orgName"
          placeholder="Acme Corp"
          value={orgName}
          onChange={e => { setOrgName(e.target.value); setError(''); }}
          className="mt-1"
        />
      </div>
      <Button className="w-full" onClick={handleCreate} disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Organization
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => setMode('choose')}>← Back</Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/auth/OrgSetupStep.tsx
git commit -m "feat: add OrgSetupStep component for post-signup org setup"
```

---

### Task 9: Frontend — InvitePage (/invite/:token)

**Files:**
- Create: `client/src/pages/InvitePage.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Create InvitePage**

```tsx
// client/src/pages/InvitePage.tsx
import { useEffect, useState } from "react";
import { useParams, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, session } = useAuth();
  const [details, setDetails] = useState<{org_name: string; role: string} | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/invite/${token}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) setDetails(json.data);
        else setError(json.message || 'Invalid invite');
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setIsLoading(false));
  }, [token]);

  // Not logged in — redirect to signup with invite token
  if (!user && !session) {
    return <Redirect to={`/signup?invite=${token}`} />;
  }

  if (accepted) {
    return <Redirect to="/dashboard" />;
  }

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to accept invite');
      setAccepted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-xl shadow-md p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold">Organization Invite</h1>
        </div>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : details ? (
          <>
            <p className="text-gray-600 dark:text-gray-400">
              You've been invited to join <strong>{details.org_name}</strong> as <strong>{details.role}</strong>.
            </p>
            <Button className="w-full" onClick={handleAccept} disabled={isLoading}>
              Accept Invite & Join
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
```

**Step 2: Add route in App.tsx**

```tsx
import InvitePage from "@/pages/InvitePage";

// Inside Router, add before the protected routes:
<Route path="/invite/:token" component={InvitePage} />
```

**Step 3: Commit**

```bash
git add client/src/pages/InvitePage.tsx client/src/App.tsx
git commit -m "feat: add /invite/:token page and route"
```

---

### Task 10: Frontend — Two-step signup

**Files:**
- Modify: `client/src/pages/signup-page.tsx`
- Modify: `client/src/hooks/use-auth.tsx`

**Step 1: Add inviteToken to signUpWithEmail in use-auth.tsx**

Update `AuthContextType`:
```ts
signUpWithEmail: (
  email: string,
  password: string,
  metadata?: { username?: string; fullName?: string },
  inviteToken?: string
) => Promise<void>;
```

Update the hook body to accept and store `inviteToken` — after successful signup, if inviteToken is present, store it in sessionStorage so the OrgSetupStep can read it:
```ts
const signUpWithEmail = useCallback(
  async (email, password, metadata?, inviteToken?) => {
    const { error } = await supabase.auth.signUp({ ... });
    if (error) throw new Error(error.message);
    if (inviteToken) sessionStorage.setItem('pendingInvite', inviteToken);
    toast({ title: "Registration successful", description: "Welcome to InfraAudit!" });
  },
  [toast]
);
```

**Step 2: Update signup-page.tsx for two-step flow**

Read `?invite=:token` from URL. Add a `step` state: `'form' | 'org'`.

After successful `signUpWithEmail`, set `step = 'org'` instead of relying on redirect.

```tsx
import { useSearch } from "wouter";
import { OrgSetupStep } from "@/components/auth/OrgSetupStep";

// In component:
const searchString = useSearch();
const inviteToken = new URLSearchParams(searchString).get('invite') || undefined;
const [step, setStep] = useState<'form' | 'org'>('form');

// Remove the top-level `if (user) return <Redirect to="/dashboard" />;`
// Replace with: only redirect to dashboard if user exists AND step is complete
if (user && step === 'form') {
  // User already logged in, go to dashboard
  return <Redirect to="/dashboard" />;
}

// After signUpWithEmail succeeds:
const handleSubmit = async (e) => {
  // ...
  await signUpWithEmail(formData.email, formData.password, {
    username: formData.username,
    fullName: formData.fullName,
  }, inviteToken);
  setStep('org'); // Show org setup instead of redirecting
  // ...
};

// In the render, when step === 'org':
if (step === 'org' && session) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-8">
      <div className="max-w-sm w-full">
        <OrgSetupStep
          accessToken={session.access_token}
          inviteToken={inviteToken}
          onComplete={() => { window.location.href = '/dashboard'; }}
        />
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/pages/signup-page.tsx client/src/hooks/use-auth.tsx
git commit -m "feat: two-step signup with org setup after account creation"
```

---

### Task 11: Frontend — Show org name in Navbar + Profile

**Files:**
- Modify: `client/src/components/layout/Navbar.tsx`
- Modify: `client/src/pages/Profile.tsx`
- Modify: `client/src/types/index.ts` (or wherever `User` type is defined)

**Step 1: Add org fields to User type**

Find the `User` type in `client/src/types/` (likely `index.ts`). Add:
```ts
organizationId?: number;
orgName?: string;
```

**Step 2: Update Navbar to show org name**

In the user dropdown section of `Navbar.tsx`, below the user email, add:
```tsx
{user.orgName && (
  <p className="text-xs text-slate-500 px-1 pb-1">{user.orgName}</p>
)}
```

**Step 3: Update Profile page**

Below the existing role badge, add:
```tsx
{user.orgName && (
  <Badge variant="outline" className="gap-1">
    <Building2 className="h-3 w-3" />
    {user.orgName}
  </Badge>
)}
```

**Step 4: Commit**

```bash
git add client/src/types/ client/src/components/layout/Navbar.tsx client/src/pages/Profile.tsx
git commit -m "feat: show org name in navbar and profile page"
```

---

### Task 12: Final — Settings Team tab — show Pending badge + invite email link

**Files:**
- Modify: `client/src/pages/Settings.tsx`

The team member list currently shows `status: "invited"`. The design calls for a "Pending" badge.

**Step 1: Update team member status display**

In the team member row rendering, replace any plain text status display with:
```tsx
{member.status === 'invited' && (
  <Badge variant="outline" className="text-yellow-600 border-yellow-400 text-xs">Pending</Badge>
)}
{member.status === 'active' && (
  <Badge variant="outline" className="text-green-600 border-green-400 text-xs">Active</Badge>
)}
```

**Step 2: Commit**

```bash
git add client/src/pages/Settings.tsx
git commit -m "feat: show Pending badge for unaccepted team invites"
```
