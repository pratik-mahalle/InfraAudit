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
