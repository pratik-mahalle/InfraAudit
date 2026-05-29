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
