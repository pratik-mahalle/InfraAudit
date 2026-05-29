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
