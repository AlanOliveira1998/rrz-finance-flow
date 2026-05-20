import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  require: keyof ReturnType<typeof usePermissions>;
  fallback?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  require,
  fallback = '/dashboard',
}) => {
  const permissions = usePermissions();

  if (!permissions[require]) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
